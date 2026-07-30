from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent
OUT = ROOT / "user_schema_block_diagram_4k_large_text_white.png"

W, H = 4096, 4096
BG = "#ffffff"
INK = "#172033"
MUTED = "#374151"
GRID = "#edf0f3"
RULE = "#d6dbe1"
BOX_FILL = "#ffffff"
BOX_BORDER = "#172033"


def load_font(size, bold=False):
    candidates = [
        "C:/Windows/Fonts/timesbd.ttf" if bold else "C:/Windows/Fonts/times.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/calibrib.ttf" if bold else "C:/Windows/Fonts/calibri.ttf",
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            pass
    return ImageFont.load_default()


TITLE = load_font(124, True)
SUBTITLE = load_font(52)
TABLE_FONT = load_font(66, True)
FIELD_FONT = load_font(52)
FIELD_BOLD = load_font(52, True)
NOTE_FONT = load_font(40)
LEGEND_FONT = load_font(42, True)


SCHEMA = [
    (
        "USER",
        [
            ("user_id", "PK"),
            ("name", ""),
            ("email", "UQ"),
            ("password", ""),
            ("role", ""),
            ("isActive", ""),
            ("created_at", ""),
            ("updated_at", ""),
        ],
    ),
    (
        "STUDENT_PROFILE",
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
        "TASK",
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
        "MOCK_INTERVIEW",
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
        "ATS_REVIEW",
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
        "PLACEMENT_APPLICATION",
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
        "NOTIFICATION",
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
        "MESSAGE",
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


def field_label(field, tag):
    return field if not tag else f"{field} ({tag})"


def field_width(draw, field, tag):
    label = field_label(field, tag)
    font = FIELD_BOLD if tag in {"PK", "FK", "UQ"} else FIELD_FONT
    return max(250, text_width(draw, label, font) + 76)


def draw_field(draw, x, y, field, tag, height):
    label = field_label(field, tag)
    font = FIELD_BOLD if tag in {"PK", "FK", "UQ"} else FIELD_FONT
    width = field_width(draw, field, tag)
    draw.rectangle(
        (x, y, x + width, y + height),
        outline=BOX_BORDER,
        width=6,
        fill=BOX_FILL,
    )
    text_x = x + 30
    text_box = draw.textbbox((0, 0), label, font=font)
    text_h = text_box[3] - text_box[1]
    text_y = y + (height - text_h) // 2 - 3
    draw.text((text_x, text_y), label, fill=INK, font=font)
    if tag == "PK":
        underline_y = text_y + text_h + 4
        draw.line(
            (text_x, underline_y, text_x + text_width(draw, field, font), underline_y),
            fill=INK,
            width=4,
        )
    return width


def field_rows(draw, fields, max_width, gap):
    rows = []
    row = []
    current_width = 0
    for field, tag in fields:
        width = field_width(draw, field, tag)
        next_width = width if not row else current_width + gap + width
        if row and next_width > max_width:
            rows.append(row)
            row = [(field, tag)]
            current_width = width
        else:
            row.append((field, tag))
            current_width = next_width
    if row:
        rows.append(row)
    return rows


def draw_wrapped_note(draw, text, x, y, max_width, font, fill):
    words = text.split()
    lines = []
    current = ""
    for word in words:
        candidate = word if not current else f"{current} {word}"
        if text_width(draw, candidate, font) <= max_width:
            current = candidate
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    for idx, line in enumerate(lines):
        draw.text((x, y + idx * 48), line, fill=fill, font=font)


def main():
    image = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(image)

    margin_x = 130
    label_rule_x = 1030
    fields_left = 1100
    top = 585
    entity_gap = 115
    field_gap = 0
    field_height = 112
    field_row_gap = 18
    fields_max_width = W - fields_left - margin_x

    for y in range(290, H - 300, 170):
        draw.line((margin_x - 30, y, W - margin_x + 30, y), fill=GRID, width=3)
    draw.line((label_rule_x, 245, label_rule_x, H - 370), fill=RULE, width=4)

    draw.text((margin_x, 95), "Schema Diagram", fill=INK, font=TITLE)
    draw.text(
        (margin_x, 225),
        "Placement AI - AI-Powered Placement Preparation and Student Progress Tracker",
        fill=MUTED,
        font=SUBTITLE,
    )
    draw.text(
        (W - 1205, 150),
        "PK = Primary Key   FK = Foreign Key   UQ = Unique",
        fill=MUTED,
        font=NOTE_FONT,
    )

    y = top
    for table_name, fields in SCHEMA:
        rows = field_rows(draw, fields, fields_max_width, field_gap)
        draw.text((margin_x, y + 22), table_name, fill="#111827", font=TABLE_FONT)

        row_y = y
        for row in rows:
            x = fields_left
            for field, tag in row:
                x += draw_field(draw, x, row_y, field, tag, field_height) + field_gap
            row_y += field_height + field_row_gap

        y = row_y + entity_gap

    note_y = H - 300
    draw.rounded_rectangle(
        (margin_x, note_y, W - margin_x, note_y + 135),
        radius=24,
        outline=BOX_BORDER,
        width=4,
        fill="#ffffff",
    )
    draw.text((margin_x + 46, note_y + 36), "Major links:", fill=INK, font=LEGEND_FONT)
    note = (
        "USER -> STUDENT_PROFILE; USER -> TASK / MOCK_INTERVIEW / ATS_REVIEW / "
        "PLACEMENT_APPLICATION / NOTIFICATION; STUDENT_PROFILE -> TASK / MOCK_INTERVIEW / "
        "ATS_REVIEW; MESSAGE uses sender_id and receiver_id to connect users."
    )
    draw_wrapped_note(
        draw,
        note,
        margin_x + 290,
        note_y + 38,
        W - (margin_x * 2) - 350,
        NOTE_FONT,
        INK,
    )

    image.save(OUT, quality=100)
    print(OUT)


if __name__ == "__main__":
    main()
