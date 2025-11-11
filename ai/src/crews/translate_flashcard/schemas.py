from pydantic import BaseModel, Field


class TranslationOutput(BaseModel):
    """Schema for the translation output."""

    translation: str = Field(
        ...,
        description="The translated text in the target language"
    )
