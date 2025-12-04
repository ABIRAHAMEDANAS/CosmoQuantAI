"""optimize market_data with timescaledb

Revision ID: optimize_market_data
Revises: b32816ddd3cb
Create Date: 2024-03-20 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'optimize_market_data'
down_revision = 'b32816ddd3cb' # আপনার আগের মাইগ্রেশন ID (ফাইলের নাম থেকে নেওয়া)
branch_labels = None
depends_on = None


def upgrade():
    # 1. TimescaleDB এক্সটেনশন এনাবল করা
    op.execute("CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;")
    
    # 2. পুরনো Primary Key (id) রিমুভ করা
    # (নোট: constraint-এর নাম সাধারণত 'tablename_pkey' হয়)
    try:
        op.drop_constraint('market_data_pkey', 'market_data', type_='primary')
        op.drop_column('market_data', 'id')
    except Exception as e:
        print(f"Skipping PK drop (might apply if creating fresh): {e}")

    # 3. নতুন Composite Primary Key সেট করা (timestamp সহ)
    # এটি না করলে create_hypertable এরর দিবে
    try:
        op.create_primary_key(
            'pk_market_data', 
            'market_data', 
            ['exchange', 'symbol', 'timeframe', 'timestamp']
        )
    except Exception as e:
        print(f"Skipping PK creation: {e}")

    # 4. market_data টেবিলকে Hypertable-এ কনভার্ট করা
    op.execute("SELECT create_hypertable('market_data', 'timestamp', if_not_exists => TRUE, migrate_data => TRUE);")
    
    # 5. কমপ্রেশন পলিসি (Optional)
    op.execute("ALTER TABLE market_data SET (timescaledb.compress, timescaledb.compress_segmentby = 'symbol');")
    op.execute("SELECT add_compression_policy('market_data', INTERVAL '7 days', if_not_exists => TRUE);")


def downgrade():
    # রিভার্স করার প্রয়োজন হলে (সাধারণত হাইপারটেবিল নরমাল টেবিলে ব্যাক করা জটিল, তাই এখানে ড্রপ করা হচ্ছে না)
    pass
