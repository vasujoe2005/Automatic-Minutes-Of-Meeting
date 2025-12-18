'''
Revision ID: 20251218140000
Revises: 20251217120000
Create Date: 2025-12-18 14:00:00
'''

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20251218140000"
down_revision = "20251217120000"
branch_labels = None
depends_on = None


def upgrade():
    # Add created_at column to meetings table
    op.add_column('meetings', sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True))


def downgrade():
    # Remove created_at column from meetings table
    op.drop_column('meetings', 'created_at')
