from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent
OUT = ROOT / "placement_ai_schema_diagram_box_style.png"


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
SUBTITLE = load_font(24, False)
TABLE_FONT = load_font(24, True)
FIELD_FONT = load_font(20, False)
FIELD_BOLD = load_font(20, True)
NOTE_FONT = load_font(18, False)


schema = [
    ("User", [
        ("_id", "PK"), ("name", ""), ("email", "UQ"), ("password", ""),
        ("role", ""), ("isActive", ""), ("lastLoginAt", "")
    ]),
    ("StudentProfile", [
        ("_id", "PK"), ("userId", "FK"), ("mentorId", "FK"), ("department", ""),
        ("semester", ""), ("targetRole", ""), ("skills[]", ""), ("weakTopics[]", ""),
        ("parsedResume", ""), ("readinessScore", "")
    ]),
    ("Task", [
        ("_id", "PK"), ("userId", "FK"), ("studentId", "FK"), ("assignedBy", "FK"),
        ("title", ""), ("category", ""), ("deadline", ""), ("priority", ""), ("status", "")
    ]),
    ("ProgressLog", [
        ("_id", "PK"), ("userId", "FK"), ("studentId", "FK"), ("date", ""),
        ("topicsCompleted[]", ""), ("studyMinutes", ""), ("mockInterviewScore", ""),
        ("resumeScore", ""), ("status", "")
    ]),
    ("MockInterview", [
        ("_id", "PK"), ("userId", "FK"), ("studentId", "FK"), ("type", ""),
        ("company", ""), ("questions[]", ""), ("answers[]", ""), ("overallScore", ""), ("status", "")
    ]),
    ("ATSReview", [
        ("_id", "PK"), ("userId", "FK"), ("studentId", "FK"), ("resumeText", ""),
        ("jobDescription", ""), ("matchedKeywords[]", ""), ("missingKeywords[]", ""), ("metrics", "")
    ]),
    ("PlacementApplication", [
        ("_id", "PK"), ("userId", "FK"), ("studentId", "FK"), ("company", ""),
        ("role", ""), ("status", ""), ("priority", ""), ("rounds[]", ""), ("timeline[]", "")
    ]),
    ("CodingProblem", [
        ("_id", "PK"), ("slug", "UQ"), ("title", ""), ("difficulty", ""),
        ("category", ""), ("companies[]", ""), ("tags[]", ""), ("testCases[]", "")
    ]),
    ("CodingSubmission", [
        ("_id", "PK"), ("userId", "FK"), ("studentId", "FK"), ("problemId", "FK"),
        ("language", ""), ("code", ""), ("verdict", ""), ("score", ""), ("cases[]", "")
    ]),
    ("Conversation", [
        ("_id", "PK"), ("participants[]", "FK"), ("lastMessage", "FK"),
        ("lastMessageAt", ""), ("unreadCount", ""), ("isActive", "")
    ]),
    ("Message", [
        ("_id", "PK"), ("conversationId", "FK"), ("senderId", "FK"), ("receiverId", "FK"),
        ("content", ""), ("messageType", ""), ("isRead", ""), ("readAt", "")
    ]),
    ("Notification", [
        ("_id", "PK"), ("userId", "FK"), ("title", ""), ("message", ""),
        ("type", ""), ("priority", ""), ("status", ""), ("readAt", "")
    ]),
    ("MentorNote", [
        ("_id", "PK"), ("mentorId", "FK"), ("studentId", "FK"), ("visibility", ""),
        ("tone", ""), ("note", ""), ("actionItems[]", ""), ("reaction", "")
    ]),
    ("Analytics", [
        ("_id", "PK"), ("scope", ""), ("userId", "FK"), ("studentId", "FK"),
        ("metrics", ""), ("status", "")
    ]),
]


def text_width(draw, text, font):
    box = draw.textbbox((0, 0), text, font=font)
    return box[2] - box[0]


def draw_field(draw, x, y, text, tag, h):
    label = f"{text}" if not tag else f"{text} ({tag})"
    fnt = FIELD_BOLD if tag in {"PK", "FK", "UQ"} else FIELD_FONT
    padding = 22
    w = max(104, text_width(draw, label, fnt) + padding)
    draw.rectangle((x, y, x + w, y + h), outline="#1f2937", width=3, fill="#fbf8ef")
    tx = x + 10
    ty = y + (h - 20) // 2 - 2
    draw.text((tx, ty), label, fill="#172033", font=fnt)
    if tag == "PK":
        underline_y = ty + 24
        draw.line((tx, underline_y, tx + text_width(draw, text, fnt), underline_y), fill="#172033", width=2)
    return w


def main():
    width = 2450
    row_h = 74
    top = 170
    left_label = 60
    fields_left = 390
    height = top + len(schema) * (row_h + 26) + 170
    img = Image.new("RGB", (width, height), "#f7f0df")
    draw = ImageDraw.Draw(img)

    # Paper-like background rules.
    for y in range(120, height, 42):
        draw.line((40, y, width - 40, y), fill="#eadfc8", width=1)
    draw.line((330, 100, 330, height - 80), fill="#d7c6a2", width=2)

    draw.text((60, 42), "Schema Diagram", fill="#172033", font=TITLE)
    draw.text((60, 94), "Placement AI - AI-Powered Placement Preparation and Student Progress Tracker", fill="#374151", font=SUBTITLE)
    draw.text((width - 520, 62), "PK = Primary Key   FK = Reference   UQ = Unique", fill="#374151", font=NOTE_FONT)

    y = top
    for table_name, fields in schema:
        draw.text((left_label, y + 16), table_name, fill="#111827", font=TABLE_FONT)
        x = fields_left
        for field, tag in fields:
            fw = draw_field(draw, x, y, field, tag, 56)
            x += fw
        y += row_h + 26

    # Relationship hints at the bottom.
    note_y = height - 115
    draw.rounded_rectangle((60, note_y, width - 60, note_y + 64), radius=18, outline="#374151", width=2, fill="#fffaf0")
    notes = (
        "Major links: User -> StudentProfile, StudentProfile -> Task / ProgressLog / MockInterview / ATSReview / "
        "PlacementApplication, CodingProblem -> CodingSubmission, Conversation -> Message."
    )
    draw.text((85, note_y + 20), notes, fill="#172033", font=NOTE_FONT)

    img.save(OUT)
    print(OUT)


if __name__ == "__main__":
    main()
