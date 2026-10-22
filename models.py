from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    Date,
    DateTime,
    ForeignKey
)

from sqlalchemy.orm import relationship

from database import Base


# =====================================================
# VEHICLE
# =====================================================

class Vehicle(Base):

    __tablename__ = "vehicles"


    id = Column(
        Integer,
        primary_key=True,
        index=True
    )


    name = Column(
        String,
        nullable=False
    )


    vehicle_type = Column(
        String,
        nullable=False
    )


    registration_number = Column(
        String,
        unique=True,
        nullable=False
    )


    vehicle_value = Column(
        Float,
        nullable=False
    )


    rent_per_day = Column(
        Float,
        nullable=False
    )


    available = Column(
        Boolean,
        default=True
    )


    rentals = relationship(
        "Rental",
        back_populates="vehicle",
        cascade="all, delete-orphan"
    )


# =====================================================
# RENTAL
# =====================================================

class Rental(Base):

    __tablename__ = "rentals"


    id = Column(
        Integer,
        primary_key=True,
        index=True
    )


    customer_name = Column(
        String,
        nullable=False
    )


    customer_phone = Column(
        String,
        nullable=False
    )


    start_date = Column(
        Date,
        nullable=False
    )


    end_date = Column(
        Date,
        nullable=False
    )


    rental_days = Column(
        Integer,
        nullable=False
    )


    total_cost = Column(
        Float,
        nullable=False
    )


    status = Column(
        String,
        default="Active"
    )


    returned_at = Column(
        DateTime,
        nullable=True
    )


    vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id"),
        nullable=False
    )


    vehicle = relationship(
        "Vehicle",
        back_populates="rentals"
    )