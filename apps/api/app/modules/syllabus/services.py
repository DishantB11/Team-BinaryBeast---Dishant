from pathlib import Path
import re

from fastapi import UploadFile
from pypdf import PdfReader
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import NotFoundException
from app.db.models import SyllabusDocument
from app.repositories.academic import SubjectRepository, UserRepository
from app.repositories.syllabus import SyllabusRepository
from app.schemas.syllabus import SyllabusDocumentRead, SyllabusDocumentUpdate


class SyllabusService:
    """Store and extract structured syllabus information from uploads."""

    def __init__(self, session: Session) -> None:
        self.session = session
        self.user_repository = UserRepository(session)
        self.subject_repository = SubjectRepository(session)
        self.syllabus_repository = SyllabusRepository(session)

    async def upload_document(self, user_id: str, subject_id: str | None, file: UploadFile) -> SyllabusDocumentRead:
        user = self.user_repository.get(user_id)
        if user is None:
            raise NotFoundException("User")
        if subject_id and self.subject_repository.get(subject_id) is None:
            raise NotFoundException("Subject")

        target_dir = Path(settings.upload_dir)
        target_dir.mkdir(parents=True, exist_ok=True)
        target_path = target_dir / f"{user_id}_{file.filename}"
        file_bytes = await file.read()
        target_path.write_bytes(file_bytes)

        raw_text = self._extract_text(target_path, file.content_type or "application/octet-stream")
        structure = self._extract_structure(raw_text)

        document = self.syllabus_repository.create(
            SyllabusDocument(
                user_id=user_id,
                subject_id=subject_id,
                file_name=file.filename or "syllabus",
                file_path=str(target_path),
                content_type=file.content_type or "application/octet-stream",
                raw_text=raw_text,
                extracted_structure=structure,
            )
        )
        return SyllabusDocumentRead.model_validate(document)

    def list_documents(self, user_id: str | None = None) -> list[SyllabusDocumentRead]:
        return [SyllabusDocumentRead.model_validate(item) for item in self.syllabus_repository.list(user_id=user_id)]

    def get_document(self, document_id: str) -> SyllabusDocumentRead:
        doc = self.syllabus_repository.get(document_id)
        if doc is None:
            raise NotFoundException("SyllabusDocument", document_id)
        return SyllabusDocumentRead.model_validate(doc)

    def update_document(self, document_id: str, payload: SyllabusDocumentUpdate) -> SyllabusDocumentRead:
        doc = self.syllabus_repository.get(document_id)
        if doc is None:
            raise NotFoundException("SyllabusDocument", document_id)
        updates = payload.model_dump(exclude_none=True)
        if updates:
            doc = self.syllabus_repository.update(doc, updates)
        return SyllabusDocumentRead.model_validate(doc)

    def delete_document(self, document_id: str) -> None:
        doc = self.syllabus_repository.get(document_id)
        if doc is None:
            raise NotFoundException("SyllabusDocument", document_id)
        # Remove the file from disk
        file_path = Path(doc.file_path)
        if file_path.exists():
            file_path.unlink()
        self.syllabus_repository.delete(doc)

    def _extract_text(self, path: Path, content_type: str) -> str:
        if content_type == "application/pdf" or path.suffix.lower() == ".pdf":
            try:
                reader = PdfReader(str(path))
                extracted = []
                for page in reader.pages:
                    text = page.extract_text()
                    if text:
                        extracted.append(text)
                return "\n".join(extracted).strip()
            except Exception:
                return ""
        try:
            return path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            return ""

    def parse_text_directly(self, raw_text: str) -> dict:
        """Parse raw text directly without file upload (useful for API and tests)."""
        return self._extract_structure(raw_text)

    def _is_noise_line(self, line: str) -> bool:
        """Filter out reference books, authors, publishers, ISBNs, and administrative noise."""
        noise_keywords = [
            "reference book", "textbook", "text book", "edition", "publisher", "isbn",
            "press", "mcgraw", "pearson", "wiley", "springer", "oxford", "tata",
            "author", "vol.", "volume", "pp.", "pages", "cengage", "hall", "phi",
            "recommended reading", "further reading", "syllabus details", "course coordinator",
            "reference", "references", "reading list", "text books", "reference material",
        ]
        line_lower = line.lower()
        if any(kw in line_lower for kw in noise_keywords):
            return True
        # Match author/publication patterns like "Peter V. O'Neil", "John Wiley & Sons", "2nd Edition", "2012"
        if re.search(r"\b(ed|edition|vol|vol\.|pp|isbn|\d{4})\b", line_lower):
            return True
        if re.search(r"[A-Z][a-z]+\s+[A-Z]\.?", line): # Author name pattern like "O' Neil", "Kreyszig"
            if not any(header in line_lower for header in ["module", "unit", "chapter", "topic"]):
                return True
        return False

    def _call_watsonx_llm(self, raw_text: str) -> dict | None:
        """Call IBM Watsonx LLM client to intelligently parse syllabus text into structured JSON."""
        if not settings.watsonx_apikey or not settings.watsonx_project_id:
            return None

        try:
            from ibm_watsonx_ai.foundation_models import Model
            from ibm_watsonx_ai.metanames import GenTextParamsMetaNames as GenParams

            credentials = {
                "url": settings.watsonx_url,
                "apikey": settings.watsonx_apikey,
            }

            params = {
                GenParams.MAX_NEW_TOKENS: 1024,
                GenParams.TEMPERATURE: 0.1,
            }

            model_id = "meta-llama/llama-3-70b-instruct"

            model_kwargs = {
                "model_id": model_id,
                "params": params,
                "credentials": credentials,
            }
            if settings.watsonx_project_id:
                model_kwargs["project_id"] = settings.watsonx_project_id

            model = Model(**model_kwargs)

            prompt = f"""
[SYSTEM INSTRUCTION]
You are an expert Academic Curriculum Parsing AI.
Your sole mission is to analyze university syllabus documents (Engineering, EEE, ECE, CSE, Mathematics, Physics) and extract ALL genuine study modules sequentially in exact numerical order.

[STRICT ORDERING & HALLUCINATION RULES]
1. PRESERVE EXACT SEQUENTIAL ORDERING: Do NOT skip any modules (e.g. if Module 1 exists, Module 2 MUST follow before Module 3).
2. DO NOT INVENT/HALLUCINATE MODULES: Never invent fictional module numbers (e.g. creating Module 6 if the document only has 4 or 5 modules).
3. READ ENTIRE TEXT SEQUENTIALLY: Parse the text from top to bottom. Every section labeled "Module 1", "Module 2", "Module 3", "Unit 1", "Unit 2", "Chapter 1", etc. MUST be captured as an distinct module entry.

[NEGATIVE CONSTRAINTS - STRICTLY FORBIDDEN IN OUTPUT]
- DO NOT extract reference books, text books, book titles, author names (e.g., Alexander, Sadiku, Boylestad, Nashelsky, Hayt, Kemmerly, Kothari, Nagrath, Erwin Kreyszig, Peter V. O'Neil, Cengage, Wiley, Pearson, McGraw-Hill).
- DO NOT extract ISBN numbers, publication years, edition numbers (e.g. 7th Edition, 10th Ed), or page numbers (pp. 10-50).
- DO NOT extract grading policies, office hours, classroom rules, or instructor names.

[FEW-SHOT EEE & MAT SYLLABUS EXAMPLE]
Input Syllabus snippet:
"EEE1001 BASIC ELECTRICAL AND ELECTRONICS ENGINEERING
Module 1: DC Circuits
Ohm's Law, Kirchhoff's Laws, Mesh and Nodal Analysis, Thevenin and Norton Theorems.
Module 2: AC Circuits
Single Phase AC Circuits, Phasor Representation, RMS and Average Value, Power Factor.
Module 3: Electrical Machines
Transformers, DC Motors, Induction Motors, Principles of Operation.
Reference Books:
1. Charles K. Alexander, Matthew N. O. Sadiku, Fundamentals of Electric Circuits, McGraw-Hill.
2. Robert L. Boylestad, Louis Nashelsky, Electronic Devices and Circuit Theory, Pearson."

Output JSON:
{{
  "title": "Basic Electrical and Electronics Engineering",
  "course_code": "EEE1001",
  "module_count": 3,
  "modules": [
    {{
      "type": "Module",
      "number": "1",
      "title": "Module 1: DC Circuits",
      "topics": ["Ohm's Law", "Kirchhoff's Laws", "Mesh and Nodal Analysis", "Thevenin and Norton Theorems"]
    }},
    {{
      "type": "Module",
      "number": "2",
      "title": "Module 2: AC Circuits",
      "topics": ["Single Phase AC Circuits", "Phasor Representation", "RMS and Average Value", "Power Factor"]
    }},
    {{
      "type": "Module",
      "number": "3",
      "title": "Module 3: Electrical Machines",
      "topics": ["Transformers", "DC Motors", "Induction Motors", "Principles of Operation"]
    }}
  ],
  "extracted_assignments": [],
  "extracted_exams": []
}}

[TARGET DOCUMENT TO PARSE]
\"\"\"
{raw_text[:7000]}
\"\"\"

Return ONLY valid, raw JSON matching the exact schema without commentary or markdown ticks:
"""

            response_text = model.generate_text(prompt=prompt)
            # Find JSON block in response
            json_match = re.search(r"\{.*\}", response_text, re.DOTALL)
            if json_match:
                import json
                parsed_data = json.loads(json_match.group(0))
                return parsed_data
        except Exception as e:
            # Fallback to local regex if Watsonx call fails or key is invalid
            print(f"[Watsonx AI Fallback] AI parsing exception: {e}")
            return None

        return None

    def _extract_structure(self, raw_text: str) -> dict:
        # 1. Try IBM Watsonx LLM Agent first
        ai_structure = self._call_watsonx_llm(raw_text)
        if ai_structure and isinstance(ai_structure, dict) and "modules" in ai_structure:
            ai_structure["summary"] = [line.strip() for line in raw_text.splitlines() if line.strip()][:15]
            return ai_structure

        # 2. Local Engine Fallback (Rule-Based Clean Parser)
        lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
        if not lines:
            return {
                "title": "Empty Syllabus",
                "course_code": None,
                "module_count": 0,
                "modules": [],
                "extracted_assignments": [],
                "extracted_exams": [],
                "summary": [],
            }

        title = lines[0]
        course_code = None

        section_pattern = re.compile(
            r"^(module|unit|chapter|week|section|part)\s*(\d+|[ivxlcdm]+)[:\s\.\-—]*(.*)$",
            re.IGNORECASE,
        )

        num_section_pattern = re.compile(r"^(module|unit|chapter|week)?\s*(\d+|[IVXLCDM]+)[\.\:\-]\s*(.+)$", re.IGNORECASE)

        code_pattern = re.compile(r"\b([A-Z]{2,4}[- ]?\d{3,4})\b")
        for line in lines[:15]:
            match = code_pattern.search(line)
            if match:
                course_code = match.group(1)
                break

        assignment_pattern = re.compile(r"(assignment|project|lab|quiz|homework|submission|task)\s*\d*[:\s\.\-—]*(.*)", re.IGNORECASE)
        exam_pattern = re.compile(r"(midterm|final|exam|test|assessment)\s*\d*[:\s\.\-—]*(.*)", re.IGNORECASE)
        date_pattern = re.compile(r"\b(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:,\s*\d{4})?)\b", re.IGNORECASE)

        modules: list[dict] = []
        extracted_assignments: list[dict] = []
        extracted_exams: list[dict] = []

        current_module: dict | None = None

        for line in lines:
            if self._is_noise_line(line):
                continue

            section_match = section_pattern.match(line)
            num_match = num_section_pattern.match(line) if not section_match else None

            if section_match or num_match:
                if section_match:
                    section_type = section_match.group(1).title()
                    section_num = section_match.group(2)
                    section_title = section_match.group(3).strip() or f"{section_type} {section_num}"
                else:
                    section_type = "Module"
                    section_num = num_match.group(2)
                    section_title = num_match.group(3).strip()

                current_module = {
                    "type": section_type,
                    "number": str(section_num),
                    "title": f"{section_type} {section_num}: {section_title}" if section_title != f"{section_type} {section_num}" else section_title,
                    "topics": [],
                }
                modules.append(current_module)
                continue

            assign_match = assignment_pattern.search(line)
            if assign_match:
                dates = date_pattern.findall(line)
                extracted_assignments.append({
                    "title": line,
                    "due_date_str": dates[0] if dates else None,
                    "module": current_module["title"] if current_module else None,
                })

            exam_match = exam_pattern.search(line)
            if exam_match:
                dates = date_pattern.findall(line)
                extracted_exams.append({
                    "title": line,
                    "scheduled_date_str": dates[0] if dates else None,
                })

            if current_module is not None:
                if not assign_match and not exam_match and len(current_module["topics"]) < 15:
                    current_module["topics"].append(line)

        clean_modules = [m for m in modules if not self._is_noise_line(m["title"])]

        return {
            "title": title,
            "course_code": course_code or title[:30],
            "module_count": len(clean_modules),
            "modules": clean_modules,
            "extracted_assignments": extracted_assignments,
            "extracted_exams": extracted_exams,
            "summary": lines[:15],
        }


