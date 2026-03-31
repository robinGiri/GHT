"""Seed the database with the GHT product catalog on first run."""
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.models.product import Product


PRODUCTS = [
    # Digital maps
    {"id": "NP101", "type": "digital_map", "sku": "NP101D", "name": "GHT Digital Map — Kanchenjunga", "price": 10.0,
     "map_code": "NP101", "region": "Kanchenjunga", "region_tag": "far-east", "scale": "1:100,000",
     "file_label": "PDF, high-resolution (~350 MB)", "updated_year": "2026",
     "description": "Comprehensive topographic map of the Kanchenjunga region covering North Base Camp (Pangpema), South Base Camp (Oktang), and the full circuit."},
    {"id": "NP102", "type": "digital_map", "sku": "NP102D", "name": "GHT Digital Map — Makalu", "price": 10.0,
     "map_code": "NP102", "region": "Makalu", "region_tag": "far-east", "scale": "1:100,000",
     "file_label": "PDF, high-resolution (~350 MB)", "updated_year": "2026",
     "description": "Detailed topographic map of the Makalu region including Makalu Base Camp and Barun Valley."},
    {"id": "NP103", "type": "digital_map", "sku": "NP103D", "name": "GHT Digital Map — Everest Region", "price": 10.0,
     "map_code": "NP103", "region": "Solu-Khumbu (Everest)", "region_tag": "khumbu", "scale": "1:100,000",
     "file_label": "PDF, high-resolution (~350 MB)", "updated_year": "2026",
     "description": "Everest Base Camp, Gokyo Lakes, Three Passes, and all major Khumbu trails. Updated 2026."},
    {"id": "NP104", "type": "digital_map", "sku": "NP104D", "name": "GHT Digital Map — The Rolwaling", "price": 10.0,
     "map_code": "NP104", "region": "Rolwaling", "region_tag": "khumbu", "scale": "1:100,000",
     "file_label": "PDF, high-resolution (~350 MB)", "updated_year": "2026",
     "description": "Remote Rolwaling Valley including Tesi Lapcha Pass (5,755 m) and connections to Khumbu."},
    {"id": "NP105", "type": "digital_map", "sku": "NP105D", "name": "GHT Digital Map — Langtang & Helambu", "price": 10.0,
     "map_code": "NP105", "region": "Langtang & Helambu", "region_tag": "central", "scale": "1:100,000",
     "file_label": "PDF, high-resolution (~350 MB)", "updated_year": "2026",
     "description": "Langtang National Park, Gosaikunda Lakes, Laurebina La, and Helambu circuit."},
    {"id": "NP106", "type": "digital_map", "sku": "NP106D", "name": "GHT Digital Map — Manaslu & Ganesh Himals", "price": 10.0,
     "map_code": "NP106", "region": "Manaslu & Ganesh Himals", "region_tag": "central", "scale": "1:100,000",
     "file_label": "PDF, high-resolution (~350 MB)", "updated_year": "2026",
     "description": "Full Manaslu Circuit via Larkya La (5,106 m), Tsum Valley, and Ganesh Himal approaches."},
    {"id": "NP107", "type": "digital_map", "sku": "NP107D", "name": "GHT Digital Map — Annapurna, Naar & Phu", "price": 10.0,
     "map_code": "NP107", "region": "Annapurna, Naar & Phu", "region_tag": "central", "scale": "1:100,000",
     "file_label": "PDF, high-resolution (~350 MB)", "updated_year": "2026",
     "description": "Full Annapurna Circuit, Sanctuary, Thorong La (5,416 m), and remote Naar-Phu restricted area."},
    {"id": "NP108", "type": "digital_map", "sku": "NP108D", "name": "GHT Digital Map — Mustang", "price": 10.0,
     "map_code": "NP108", "region": "Mustang", "region_tag": "central", "scale": "1:100,000",
     "file_label": "PDF, high-resolution (~350 MB)", "updated_year": "2026",
     "description": "Lower and Upper Mustang (Lo Manthang), Trans-Himalayan high route, and Kali Gandaki gorge."},
    {"id": "NP109", "type": "digital_map", "sku": "NP109D", "name": "GHT Digital Map — Dolpo & Mugu", "price": 20.0,
     "map_code": "NP109", "region": "Dolpo & Mugu", "region_tag": "western-wilds", "scale": "1:100,000",
     "file_label": "PDF, high-resolution, double-sided (~700 MB)", "updated_year": "2026", "badge": "Double-sided",
     "description": "Shey Phoksundo National Park, Phoksundo Lake, and GHT western high route through remote Dolpo and Mugu."},
    {"id": "NP110", "type": "digital_map", "sku": "NP110D", "name": "GHT Digital Map — Far West Nepal", "price": 20.0,
     "map_code": "NP110", "region": "Far West Nepal", "region_tag": "western-wilds", "scale": "1:100,000",
     "file_label": "PDF, high-resolution, double-sided (~700 MB)", "updated_year": "2026", "badge": "Double-sided",
     "description": "Humla, Limi Valley, Saipal Base Camp, and Khaptad National Park — true wilderness."},
    {"id": "NP111", "type": "digital_map", "sku": "NP111D", "name": "GHT Digital Map — Dhorpatan & Dhaulagiri", "price": 10.0,
     "map_code": "NP111", "region": "Dhorpatan & Dhaulagiri", "region_tag": "western-wilds", "scale": "1:100,000",
     "file_label": "PDF, high-resolution (~350 MB)", "updated_year": "2026",
     "description": "Dhorpatan Hunting Reserve, French Pass, Dhaulagiri Circuit, and Myagdi valley approach routes."},
    {"id": "NP301", "type": "digital_map", "sku": "NP301D", "name": "GHT Nepal Country Route Planner", "price": 10.0,
     "map_code": "NP301", "region": "All Nepal", "region_tag": "all", "scale": "1:500,000",
     "file_label": "PDF, high-resolution (~350 MB)", "updated_year": "2026",
     "description": "Large-format overview of the entire GHT across Nepal — all 9 regions, passes, and connections."},
    # Bundle
    {"id": "BUNDLE-ALL", "type": "digital_map", "sku": "GHTDIGSET", "name": "GHT Complete Map Bundle — Nepal, Bhutan & India", "price": 130.0,
     "map_code": "BUNDLE", "region": "All regions", "region_tag": "all", "scale": None,
     "file_label": "Transfer link emailed — ~4 GB total", "updated_year": "2026", "badge": "Best Value",
     "description": "All 11 Nepal maps, Nepal Route Planner, Bhutan Route Planner, and IMF North-West India 1:50,000 map."},
    # Book
    {"id": "BOOK-001", "type": "physical_book", "sku": "9781905864607",
     "name": "Nepal Trekking and the Great Himalaya Trail — 3rd Edition", "price": 33.45,
     "map_code": None, "region": None, "region_tag": None, "scale": None,
     "file_label": None, "updated_year": "2020", "stock_quantity": 50,
     "description": "The only comprehensive route and planning guide to all major trails in Nepal and the GHT. Trailblazer, 3rd edition 2020."},
    # Donation
    {"id": "DONATE-001", "type": "donation", "sku": "GHT-DONATE",
     "name": "Donate to the GHT", "price": 10.0,
     "map_code": None, "region": None, "region_tag": None, "scale": None,
     "file_label": None, "updated_year": None,
     "description": "Support trail maintenance and conservation along the Great Himalaya Trail."},
]


def seed_products():
    db: Session = SessionLocal()
    try:
        seeded = 0
        for data in PRODUCTS:
            existing = db.query(Product).filter(Product.id == data["id"]).first()
            if not existing:
                p = Product(**data, active=True)
                db.add(p)
                seeded += 1
        db.commit()
        if seeded:
            print(f"[seed] Added {seeded} products to database")
    except Exception as e:
        db.rollback()
        print(f"[seed] Error: {e}")
    finally:
        db.close()
