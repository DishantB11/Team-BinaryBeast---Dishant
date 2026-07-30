import logging

import structlog


def configure_logging() -> None:
    """Set up predictable structured logging for local development and future production use."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(message)s",
    )
    structlog.configure(
        processors=[
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.add_log_level,
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str):
    """Return a namespaced structured logger."""
    return structlog.get_logger(name)
