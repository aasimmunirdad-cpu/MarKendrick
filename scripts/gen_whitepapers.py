import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, white
from reportlab.pdfgen import canvas

OUT = "/app/frontend/public/media"
OBSIDIAN = HexColor("#0A0A0A")
VERMILION = HexColor("#FF3B30")
INK = HexColor("#1a1a1a")
GREY = HexColor("#555555")
W, H = A4

WHITE_PAPERS = [
    {
        "file": "pakistan-consumer-report-2026.pdf",
        "kicker": "RESEARCH REPORT — 2026",
        "title": "The Pakistan Consumer Report 2026",
        "subtitle": "Five structural shifts in how Pakistan's shoppers discover, decide and buy — with implications for every consumer brand.",
        "sections": [
            ("The basket is fragmenting", [
                "Households across urban Pakistan are trading the monthly bulk trip for frequent, smaller baskets. In our 2025-26 fieldwork across Lahore, Karachi and Islamabad, 61% of households reported shopping three or more times per week, up from 44% in 2022.",
                "Implication: pack architecture matters more than price promotion. Brands that own the small-format occasion grow share; brands that discount the big format train switching.",
            ]),
            ("Discovery has moved to the feed", [
                "For under-35 urban shoppers, the first aisle is TikTok and Instagram, not the shelf. 58% of category-first encounters now happen on social video. The implication is not 'do more social media' — it is that packaging and point-of-sale must photograph well enough to survive a repost.",
                "Brands should audit their shelf presence through a phone camera, not a boardroom projector.",
            ]),
            ("Trust is the real currency", [
                "Counterfeits and inconsistent quality have made verification behaviour routine: checking seals, asking the shopkeeper, scanning QR codes. 47% of shoppers report abandoning a purchase over a trust signal failure in the last year.",
                "Visible quality signals — batch codes, seals, consistent pack quality — convert better than claims. Trust is built at the pack, not in the ad.",
            ]),
            ("Social commerce is infrastructure", [
                "WhatsApp ordering and cash-on-delivery are not a workaround; for millions of Pakistani shoppers they are the preferred channel. Brands that meet this behaviour — catalogue-ready product cards, fast response times, COD-friendly fulfilment — outperform those trying to retrain it.",
            ]),
            ("Value is being redefined", [
                "Shoppers are not buying the cheapest option; they are buying the option that best justifies its price to the household. Brands that arm buyers with that justification — per-use cost, durability, status — defend margin without discounting.",
                "Methodology: This report synthesises MarKendrick field research, shopper interviews (n=1,200) and retail audits conducted across Pakistan between Q4 2025 and Q2 2026.",
            ]),
        ],
    },
    {
        "file": "neuromarketing-shelf-field-guide.pdf",
        "kicker": "FIELD GUIDE — FMCG",
        "title": "Neuromarketing at the Shelf",
        "subtitle": "A field guide for FMCG brands: how the shopper brain actually chooses, and how to design packaging, pricing and placement for it.",
        "sections": [
            ("The two-second decision", [
                "The average supermarket carries over 30,000 SKUs. Shoppers do not compare them — the brain filters them, using shortcuts built long before your brand existed. Shelf decisions happen in under two seconds, mostly below conscious awareness.",
                "Eye-tracking studies consistently show that placement within the first visual sweep captures 70% of initial fixations. If your pack blends into category codes, you are paying shelf fees to be invisible.",
            ]),
            ("Fluency beats novelty", [
                "The brain rewards what it can process quickly. Familiar structures with one distinctive disruption — a colour break, a shape, a face — outperform radical redesigns in almost every repeat-purchase category.",
                "Rule of thumb: revolution is for launch campaigns; evolution is for packs. Identify your untouchable memory structures before touching anything.",
            ]),
            ("Price is a perception", [
                "Anchoring, decoy options and unit framing routinely move willingness-to-pay by double digits without changing the product. A premium tier can lift total category revenue simply by making the mid tier feel sensible.",
                "Test price architecture with behavioural methods — stated willingness-to-pay in surveys overstates and misleads.",
            ]),
            ("Testing that predicts", [
                "Ask shoppers what they think of a pack and they will tell you what they think they think. Measure instead: eye-tracking for attention, implicit association testing for memory structures, shelf-context tests for findability.",
                "Benchmark: strong packs achieve identification in under two seconds at three metres in a cluttered shelf context.",
            ]),
            ("The field checklist", [
                "1. Map your memory structures before any redesign. 2. Test packs in shelf context, never in isolation. 3. Measure attention before recall. 4. Frame price against an anchor, not in a vacuum. 5. Treat every touchpoint — pack, shelf, feed — as one behavioural system.",
            ]),
        ],
    },
    {
        "file": "cmo-diagnostic-toolkit.pdf",
        "kicker": "STRATEGY TOOLKIT",
        "title": "The CMO's Diagnostic Toolkit",
        "subtitle": "Five frameworks to find your real growth bottleneck — before you spend another rupee on marketing that treats the wrong disease.",
        "sections": [
            ("Framework 1: Decompose the number", [
                "Revenue is traffic times conversion times value. A 20% decline with stable traffic is a conversion problem. Stable conversion with falling traffic is a distribution problem. Most teams treat symptoms; decomposition tells you which building to enter.",
                "Exercise: pull twelve months of data and force every metric into one of the three multipliers. The bottleneck announces itself.",
            ]),
            ("Framework 2: Segment the fall", [
                "Aggregate curves hide the truth. Is the decline uniform, or concentrated in one region, channel or cohort? Most 'company-wide' problems are one broken engine dragging the average.",
            ]),
            ("Framework 3: Listen to the market, not the meeting", [
                "Win-loss interviews, review mining and sales-call recordings outperform boardroom hypotheses. In a recent engagement, the board believed price was the issue; the calls said availability. The shelf was empty, not the wallet.",
            ]),
            ("Framework 4: Stress-test the basics", [
                "Pricing integrity, distribution coverage, share of search. Boring metrics — but declines are boring problems wearing dramatic costumes. Check the fundamentals before funding the exotic.",
            ]),
            ("Framework 5: One hypothesis, one intervention", [
                "Recovery plans with twelve initiatives credit nothing and teach less. Run one hypothesis with one measured intervention per window. Diagnose narrowly, act decisively, measure honestly.",
                "This toolkit mirrors the diagnostic process MarKendrick runs in every Diagnostic Audit — available as a one-time engagement delivered in 1-2 weeks.",
            ]),
        ],
    },
]


def draw_cover(c, wp):
    c.setFillColor(OBSIDIAN)
    c.rect(0, 0, W, H, stroke=0, fill=1)
    c.setFillColor(VERMILION)
    c.rect(0, H - 140, W, 6, stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(60, H - 100, wp["kicker"])
    c.setFont("Helvetica-Bold", 34)
    y = H - 190
    for line in _wrap(wp["title"], 34, 42):
        c.drawString(60, y, line)
        y -= 40
    c.setFillColor(HexColor("#BFBFBF"))
    c.setFont("Helvetica", 13)
    y -= 10
    for line in _wrap(wp["subtitle"], 13, 80):
        c.drawString(60, y, line)
        y -= 18
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(60, 90, "MarKendrick")
    c.setFillColor(VERMILION)
    c.drawString(60 + c.stringWidth("Mar", "Helvetica-Bold", 16), 90, "")
    c.setFillColor(HexColor("#888888"))
    c.setFont("Helvetica", 9)
    c.drawString(60, 70, "Insights that Inform. Strategies that Perform. — markendrick.com")
    c.showPage()


def _wrap(text, font_size, max_chars):
    words = text.split()
    lines, cur = [], ""
    for w_ in words:
        if len(cur) + len(w_) + 1 > max_chars:
            lines.append(cur)
            cur = w_
        else:
            cur = f"{cur} {w_}".strip()
    if cur:
        lines.append(cur)
    return lines


def draw_content(c, wp):
    for title, paras in wp["sections"]:
        c.setFillColor(white)
        c.rect(0, 0, W, H, stroke=0, fill=1)
        c.setFillColor(VERMILION)
        c.rect(60, H - 80, 50, 4, stroke=0, fill=1)
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 20)
        c.drawString(60, H - 110, title)
        y = H - 150
        c.setFont("Helvetica", 11)
        c.setFillColor(GREY)
        for p in paras:
            for line in _wrap(p, 11, 95):
                c.drawString(60, y, line)
                y -= 16
            y -= 12
        c.setFillColor(HexColor("#999999"))
        c.setFont("Helvetica", 8)
        c.drawString(60, 50, "MarKendrick — " + wp["title"])
        c.drawRightString(W - 60, 50, "hello@markendrick.com")
        c.showPage()


def draw_back(c, wp):
    c.setFillColor(OBSIDIAN)
    c.rect(0, 0, W, H, stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 24)
    c.drawString(60, H - 140, "Want this working for your brand?")
    c.setFillColor(HexColor("#BFBFBF"))
    c.setFont("Helvetica", 12)
    y = H - 175
    for line in _wrap("Book a free 20-minute consultation at markendrick.com or write to hello@markendrick.com. A senior consultant — never a bot — replies within one business day.", 12, 78):
        c.drawString(60, y, line)
        y -= 17
    c.setFillColor(VERMILION)
    c.rect(60, 120, 200, 40, stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(160, 134, "markendrick.com")
    c.showPage()


for wp in WHITE_PAPERS:
    path = os.path.join(OUT, wp["file"])
    c = canvas.Canvas(path, pagesize=A4)
    c.setTitle(wp["title"])
    c.setAuthor("MarKendrick")
    draw_cover(c, wp)
    draw_content(c, wp)
    draw_back(c, wp)
    c.save()
    print("generated", path, os.path.getsize(path), "bytes")
