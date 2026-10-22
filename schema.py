from datetime import date

from pydantic import BaseModel, Field


# =====================================================
# VEHICLE SCHEMAS
# =====================================================

class VehicleCreate(BaseModel):

    name: str

    vehicle_type: str

    registration_number: str

    vehicle_value: float = Field(
        gt=0
    )

    rent_per_day: float = Field(
        gt=0
    )


class VehicleResponse(BaseModel):

    id: int

    name: str

    vehicle_type: str

    registration_number: str

    vehicle_value: float

    rent_per_day: float

    available: bool


    class Config:

        from_attributes = True


# =====================================================
# RENTAL SCHEMAS
# =====================================================

class RentalCreate(BaseModel):

    vehicle_id: int

    customer_name: str

    customer_phone: str

    start_date: date

    end_date: date


class RentalResponse(BaseModel):

    id: int

    customer_name: str

    customer_phone: str

    start_date: date

    end_date: date

    rental_days: int

    total_cost: float

    status: str

    returned_at: str | None

    vehicle_id: int

    vehicle_name: str

    registration_number: str