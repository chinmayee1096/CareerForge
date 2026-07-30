from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent
OUT = ROOT / "placement_ai_schema_diagram_1080p.png"

W, H = 1920, 1080
BG = "#F5F8FB"
INK = "#132437"
MUTED = "#607080"
CARD = "#FFFFFF"
BORDER = "#B7C7D6"
HEADER = "#0F766E"
HEADER_2 = "#1D4ED8"
LINE = "#4B6478"
SOFT = "#E8F5F2"


def load_font(size, bold=False):
    candidates = [
        "C:/Windows/Fonts/timesbd.ttf" if bold else "C:/Windows/Fonts/times.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size)
        except Exception:
            pass
    return ImageFont.load_default()


TITLE = load_font(44, True)
SUBTITLE = load_font(22)
ENTITY = load_font(20, True)
FIELD = load_font(16)
SMALL = load_font(14)
LABEL = load_font(15, True)


entities = {
    "User": {
        "fields": ["_id (PK)", "name", "email", "passwordHash", "role", "isActive"],
        "pos": (70, 160),
        "color": HEADER,
    },
    "StudentProfile": {
        "fields": ["_id (PK)", "userId (FK)", "mentorId (FK)", "department", "semester", "skills", "readinessScore"],
        "pos": (500, 160),
        "color": "#0EA5A4",
    },
    "Task": {
        "fields": ["_id (PK)", "userId (FK)", "studentId (FK)", "title", "category", "priority", "status"],
        "pos": (930, 120),
        "color": HEADER_2,
    },
    "ProgressLog": {
        "fields": ["_id (PK)", "userId (FK)", "studentId (FK)", "date", "topicsCompleted", "studyMinutes", "scores"],
        "pos": (1350, 120),
        "color": HEADER_2,
    },
    "MockInterview": {
        "fields": ["_id (PK)", "userId (FK)", "studentId (FK)", "type", "company", "questions[]", "answers[]", "overallScore"],
        "pos": (70, 450),
        "color": "#7C3AED",
    },
    "ATSReview": {
        "fields": ["_id (PK)", "userId (FK)", "studentId (FK)", "resumeText", "jobDescription", "keywords", "metrics"],
        "pos": (500, 450),
        "color": "#C2410C",
    },
    "PlacementApplication": {
        "fields": ["_id (PK)", "userId (FK)", "studentId (FK)", "company", "role", "status", "rounds[]", "timeline[]"],
        "pos": (930, 450),
        "color": "#BE123C",
    },
    "CodingProblem": {
        "fields": ["_id (PK)", "slug", "title", "difficulty", "category", "tags[]", "testCases[]"],
        "pos": (1350, 450),
        "color": "#2563EB",
    },
    "CodingSubmission": {
        "fields": ["_id (PK)", "userId (FK)", "studentId (FK)", "problemId (FK)", "language", "verdict", "score"],
        "pos": (70, 740),
        "color": "#2563EB",
    },
    "Conversation": {
        "fields": ["_id (PK)", "participants[]", "lastMessage", "lastMessageAt", "unreadCount"],
        "pos": (500, 740),
        "color": "#475569",
    },
    "Message": {
        "fields": ["_id (PK)", "conversationId (FK)", "senderId (FK)", "receiverId (FK)", "content", "isRead"],
        "pos": (930, 740),
        "color": "#475569",
    },
    "Notification / Analytics": {
        "fields": ["_id (PK)", "userId / studentId (FK)", "title / metrics", "type / scope", "status", "createdAt"],
        "pos": (1350, 740),
        "color": "#0891B2",
    },
}


BOX_W = 330
BOX_H = 220


def rounded(draw, xy, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def draw_entity(draw, name, info):
    x, y = info["pos"]
    color = info["color"]
    rounded(draw, (x, y, x + BOX_W, y + BOX_H), 18, CARD, BORDER, 2)
    rounded(draw, (x, y, x + BOX_W, y + 48), 18, color, color, 1)
    draw.rectangle((x, y + 28, x + BOX_W, y + 50), fill=color)
    draw.text((x + 18, y + 13), name, font=ENTITY, fill="white")
    yy = y + 64
    for field in info["fields"]:
        fill = INK if "(PK)" in field or "(FK)" in field else MUTED
        prefix = "◆ " if "(PK)" in field else "◇ " if "(FK)" in field else "• "
        draw.text((x + 18, yy), prefix + field, font=FIELD, fill=fill)
        yy += 22


def edge_point(name, side):
    x, y = entities[name]["pos"]
    if side == "right":
        return (x + BOX_W, y + BOX_H // 2)
    if side == "left":
        return (x, y + BOX_H // 2)
    if side == "top":
        return (x + BOX_W // 2, y)
    return (x + BOX_W // 2, y + BOX_H)


def draw_arrow(draw, start, end, label):
    sx, sy = start
    ex, ey = end
    midx = (sx + ex) // 2
    points = [(sx, sy), (midx, sy), (midx, ey), (ex, ey)]
    draw.line(points, fill=LINE, width=3, joint="curve")
    if ex >= midx:
        arrow = [(ex, ey), (ex - 12, ey - 7), (ex - 12, ey + 7)]
    else:
        arrow = [(ex, ey), (ex + 12, ey - 7), (ex + 12, ey + 7)]
    draw.polygon(arrow, fill=LINE)
    lx, ly = midx - 48, (sy + ey) // 2 - 13
    rounded(draw, (lx, ly, lx + 96, ly + 26), 10, "#FFFFFF", "#D6E1EA", 1)
    tw = draw.textlength(label, font=SMALL)
    draw.text((lx + (96 - tw) / 2, ly + 5), label, font=SMALL, fill=INK)


def draw_badge(draw, x, y, text, color):
    rounded(draw, (x, y, x + 180, y + 36), 18, color, color, 1)
    tw = draw.textlength(text, font=LABEL)
    draw.text((x + (180 - tw) / 2, y + 8), text, font=LABEL, fill="white")


def main():
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)

    # Background decoration.
    draw.ellipse((-180, -180, 420, 420), fill="#DFF7EF")
    draw.ellipse((1520, -240, 2140, 380), fill="#E2ECFF")
    draw.ellipse((1460, 760, 2100, 1280), fill="#EAF7FF")

    draw.text((70, 44), "Placement AI - NoSQL Database Schema", font=TITLE, fill=INK)
    draw.text(
        (72, 98),
        "MongoDB collections and document references used in the placement preparation tracker",
        font=SUBTITLE,
        fill=MUTED,
    )
    draw_badge(draw, 1550, 58, "MongoDB + Mongoose", HEADER)
    draw_badge(draw, 1550, 104, "MERN Project", HEADER_2)

    # Relationships behind cards.
    relationships = [
        ("User", "StudentProfile", "1 : 1", "right", "left"),
        ("StudentProfile", "Task", "1 : M", "right", "left"),
        ("Task", "ProgressLog", "progress", "right", "left"),
        ("StudentProfile", "MockInterview", "1 : M", "left", "right"),
        ("StudentProfile", "ATSReview", "1 : M", "bottom", "top"),
        ("StudentProfile", "PlacementApplication", "1 : M", "right", "left"),
        ("CodingProblem", "CodingSubmission", "1 : M", "left", "right"),
        ("Conversation", "Message", "1 : M", "right", "left"),
        ("User", "Notification / Analytics", "events", "bottom", "left"),
        ("StudentProfile", "Notification / Analytics", "metrics", "bottom", "left"),
    ]
    for a, b, label, sa, sb in relationships:
        draw_arrow(draw, edge_point(a, sa), edge_point(b, sb), label)

    for name, info in entities.items():
        draw_entity(draw, name, info)

    # Legend.
    legend_x, legend_y = 70, 1018
    draw.text((legend_x, legend_y), "Legend:", font=LABEL, fill=INK)
    draw.text((legend_x + 78, legend_y), "◆ Primary Key    ◇ Foreign Key / Reference    1:M One-to-Many Relationship", font=SMALL, fill=MUTED)
    draw.text((1475, 1018), "Resolution: 1920 x 1080 HD", font=SMALL, fill=MUTED)

    img.save(OUT, quality=96)
    print(OUT)


if __name__ == "__main__":
    main()
