from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent
OUT = ROOT / "user_schema_block_diagram_white.png"


def load_font(size, bold=False):
    candidates = [
        "C:/Windows/Fonts/timesbd.ttf" if bold else "C:/Windows/Fonts/times.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            pass
    return ImageFont.load_default()


TITLE = load_font(42, True)
SUBTITLE = load_font(23)
TABLE_FONT = load_font(24, True)
FIELD_FONT = load_font(20)
FIELD_BOLD = load_font(20, True)
NOTE_FONT = load_font(18)


SCHEMA = [
    (
        "User",
        [
            ("user_id", "PK"),
            ("name", ""),
            ("email", ""),
            ("password", ""),
            ("role", ""),
            ("isActive", ""),
            ("created_at", ""),
            ("updated_at", ""),
        ],
    ),
    (
        "StudentProfile",
        [
            ("profile_id", "PK"),
            ("user_id", "FK"),
            ("mentor_id", "FK"),
            ("department", ""),
            ("semester", ""),
            ("target_role", ""),
            ("target_companies", ""),
            ("skills", ""),
            ("weak_topics", ""),
            ("readiness_score", ""),
            ("resume_score", ""),
            ("created_at", ""),
            ("updated_at", ""),
        ],
    ),
    (
        "Task",
        [
            ("task_id", "PK"),
            ("user_id", "FK"),
            ("student_id", "FK"),
            ("title", ""),
            ("category", ""),
            ("priority", ""),
            ("status", ""),
            ("due_date", ""),
            ("completed_at", ""),
            ("created_at", ""),
            ("updated_at", ""),
        ],
    ),
    (
        "MockInterview",
        [
            ("interview_id", "PK"),
            ("user_id", "FK"),
            ("student_id", "FK"),
            ("type", ""),
            ("target_role", ""),
            ("questions", ""),
            ("overall_score", ""),
            ("feedback", ""),
            ("status", ""),
            ("created_at", ""),
        ],
    ),
    (
        "ATSReview",
        [
            ("review_id", "PK"),
            ("user_id", "FK"),
            ("student_id", "FK"),
            ("resume_text", ""),
            ("ats_score", ""),
            ("skills_found", ""),
            ("suggestions", ""),
            ("created_at", ""),
        ],
    ),
    (
        "PlacementApplication",
        [
            ("application_id", "PK"),
            ("user_id", "FK"),
            ("company_name", ""),
            ("job_role", ""),
            ("status", ""),
            ("applied_date", ""),
            ("notes", ""),
            ("created_at", ""),
            ("updated_at", ""),
        ],
    ),
    (
        "Notification",
        [
            ("notification_id", "PK"),
            ("user_id", "FK"),
            ("title", ""),
            ("message", ""),
            ("type", ""),
            ("is_read", ""),
            ("created_at", ""),
        ],
    ),
    (
        "Message",
        [
            ("message_id", "PK"),
            ("conversation_id", ""),
            ("sender_id", "FK"),
            ("receiver_id", "FK"),
            ("content", ""),
            ("message_type", ""),
            ("created_at", ""),
        ],
    ),
]


def text_width(draw, text, font):
    box = draw.textbbox((0, 0), text, font=font)
    return box[2] - box[0]


def draw_field(draw, x, y, field, tag, height):
    label = field if not tag else f"{field} ({tag})"
    font = FIELD_BOLD if tag in {"PK", "FK"} else FIELD_FONT
    width = max(94, text_width(draw, label, font) + 24)
    draw.rectangle((x, y, x + width, y + height), outline="#172033", width=3, fill="#ffffff")
    text_x = x + 10
    text_y = y + (height - 20) // 2 - 2
    draw.text((text_x, text_y), label, fill="#172033", font=font)
    if tag == "PK":
        underline_y = text_y + 24
        draw.line(
            (text_x, underline_y, text_x + text_width(draw, field, font), underline_y),
            fill="#172033",
            width=2,
        )
    return width


def main():
    width = 2300
    row_height = 76
    row_gap = 28
    top = 175
    label_left = 60
    fields_left = 405
    height = top + len(SCHEMA) * (row_height + row_gap) + 175

    image = Image.new("RGB", (width, height), "#ffffff")
    draw = ImageDraw.Draw(image)

    for y in range(120, height, 42):
        draw.line((40, y, width - 40, y), fill="#eeeeee", width=1)
    draw.line((345, 98, 345, height - 84), fill="#dddddd", width=2)

    draw.text((60, 42), "Schema Diagram", fill="#172033", font=TITLE)
    draw.text(
        (60, 94),
        "Placement AI - AI-Powered Placement Preparation and Student Progress Tracker",
        fill="#374151",
        font=SUBTITLE,
    )

    y = top
    for table_name, fields in SCHEMA:
        draw.text((label_left, y + 16), table_name, fill="#111827", font=TABLE_FONT)
        x = fields_left
        for field, tag in fields:
            x += draw_field(draw, x, y, field, tag, 56)
        y += row_height + row_gap

    note_y = height - 118
    draw.rounded_rectangle(
        (60, note_y, width - 60, note_y + 66),
        radius=18,
        outline="#374151",
        width=2,
        fill="#ffffff",
    )
    note = (
        "Major links: User -> StudentProfile, User -> Task / MockInterview / ATSReview / "
        "PlacementApplication / Notification, StudentProfile -> Task / MockInterview / ATSReview, "
        "User -> Message as sender and receiver."
    )
    draw.text((86, note_y + 21), note, fill="#172033", font=NOTE_FONT)

    image.save(OUT)
    print(OUT)


if __name__ == "__main__":
    main()
