from datetime import datetime

from pathlib import Path

from fastapi import (
    FastAPI,
    Depends,
    HTTPException
)

from fastapi.middleware.cors import CORSMiddleware

from fastapi.security import (
    OAuth2PasswordBearer,
    OAuth2PasswordRequestForm
)

from fastapi.responses import FileResponse

from sqlalchemy.orm import Session

from database import (
    Base,
    engine,
    get_db
)

from models import (
    Vehicle,
    Rental
)

from schema import (
    VehicleCreate,
    VehicleResponse,
    RentalCreate
)

from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_access_token
)


# =====================================================
# DATABASE
# =====================================================

Base.metadata.create_all(
    bind=engine
)


# =====================================================
# FASTAPI
# =====================================================

app = FastAPI(

    title="Vehicle Rental Management System",

    description="Vehicle Rental System with JWT Authentication",

    version="1.0"

)


# =====================================================
# CORS
# =====================================================

app.add_middleware(

    CORSMiddleware,

    allow_origins=["*"],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]

)


# =====================================================
# AUTHENTICATION
# =====================================================

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="login"
)


hashed_password = get_password_hash(
    "1234"
)


fake_user = {

    "username": "admin",

    "password": hashed_password

}


def get_current_user(
    token: str = Depends(oauth2_scheme)
):

    payload = decode_access_token(
        token
    )


    if payload is None:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )


    username = payload.get(
        "sub"
    )


    if username != fake_user["username"]:

        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )


    return {
        "username": username
    }


# =====================================================
# LOGIN
# =====================================================

@app.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends()
):

    if (
        form_data.username
        != fake_user["username"]
        or
        not verify_password(
            form_data.password,
            fake_user["password"]
        )
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )


    access_token = create_access_token(

        data={
            "sub": form_data.username
        }

    )


    return {

        "message": "Login successful",

        "access_token": access_token,

        "token_type": "bearer"

    }


# =====================================================
# CURRENT USER
# =====================================================

@app.get("/me")
def get_me(
    user=Depends(get_current_user)
):

    return user


# =====================================================
# HOME AND STATIC FILES
# =====================================================

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR / "FRONTEND"

from fastapi.staticfiles import StaticFiles

# Serve CSS, JavaScript, and other frontend assets
app.mount(
    "/static",
    StaticFiles(directory=FRONTEND_DIR),
    name="static"
)


# Serve the main HTML page
@app.get("/")
def home():
    return FileResponse(FRONTEND_DIR / "index.html")

@app.get("/style.css")
def serve_css():
    return FileResponse(FRONTEND_DIR / "style.css")


@app.get("/script.js")
def serve_js():
    return FileResponse(FRONTEND_DIR / "script.js")


# =====================================================
# VEHICLE - CREATE
# =====================================================

@app.post("/vehicles")
def create_vehicle(

    vehicle_data: VehicleCreate,

    db: Session = Depends(get_db),

    user=Depends(get_current_user)

):

    existing = (

        db.query(Vehicle)

        .filter(
            Vehicle.registration_number
            ==
            vehicle_data.registration_number
        )

        .first()

    )


    if existing:

        raise HTTPException(

            status_code=400,

            detail="Registration number already exists"

        )


    vehicle = Vehicle(

        name=vehicle_data.name,

        vehicle_type=vehicle_data.vehicle_type,

        registration_number=
            vehicle_data.registration_number,

        vehicle_value=
            vehicle_data.vehicle_value,

        rent_per_day=
            vehicle_data.rent_per_day,

        available=True

    )


    db.add(vehicle)

    db.commit()

    db.refresh(vehicle)


    return vehicle


# =====================================================
# VEHICLE - GET ALL
# =====================================================

@app.get("/vehicles")
def get_vehicles(

    db: Session = Depends(get_db),

    user=Depends(get_current_user)

):

    return db.query(
        Vehicle
    ).all()


# =====================================================
# VEHICLE - GET ONE
# =====================================================

@app.get("/vehicles/{vehicle_id}")
def get_vehicle(

    vehicle_id: int,

    db: Session = Depends(get_db),

    user=Depends(get_current_user)

):

    vehicle = (

        db.query(Vehicle)

        .filter(
            Vehicle.id == vehicle_id
        )

        .first()

    )


    if not vehicle:

        raise HTTPException(

            status_code=404,

            detail="Vehicle not found"

        )


    return vehicle


# =====================================================
# VEHICLE - DELETE
# =====================================================

@app.delete("/vehicles/{vehicle_id}")
def delete_vehicle(

    vehicle_id: int,

    db: Session = Depends(get_db),

    user=Depends(get_current_user)

):

    vehicle = (

        db.query(Vehicle)

        .filter(
            Vehicle.id == vehicle_id
        )

        .first()

    )


    if not vehicle:

        raise HTTPException(

            status_code=404,

            detail="Vehicle not found"

        )


    if not vehicle.available:

        raise HTTPException(

            status_code=400,

            detail="Cannot delete a currently rented vehicle"

        )


    db.delete(vehicle)

    db.commit()


    return {

        "message":
            "Vehicle deleted successfully"

    }


# =====================================================
# RENTAL - CREATE
# =====================================================

@app.post("/rentals")
def create_rental(

    rental_data: RentalCreate,

    db: Session = Depends(get_db),

    user=Depends(get_current_user)

):

    vehicle = (

        db.query(Vehicle)

        .filter(
            Vehicle.id
            ==
            rental_data.vehicle_id
        )

        .first()

    )


    if not vehicle:

        raise HTTPException(

            status_code=404,

            detail="Vehicle not found"

        )


    if not vehicle.available:

        raise HTTPException(

            status_code=400,

            detail="Vehicle is already rented"

        )


    if (
        rental_data.end_date
        <
        rental_data.start_date
    ):

        raise HTTPException(

            status_code=400,

            detail=
                "End date cannot be before start date"

        )


    rental_days = (

        rental_data.end_date
        -
        rental_data.start_date

    ).days


    if rental_days == 0:

        rental_days = 1


    total_cost = (

        rental_days
        *
        vehicle.rent_per_day

    )


    rental = Rental(

        customer_name=
            rental_data.customer_name,

        customer_phone=
            rental_data.customer_phone,

        start_date=
            rental_data.start_date,

        end_date=
            rental_data.end_date,

        rental_days=
            rental_days,

        total_cost=
            total_cost,

        status="Active",

        vehicle_id=
            vehicle.id

    )


    vehicle.available = False


    db.add(rental)

    db.commit()

    db.refresh(rental)


    return {

        "message":
            "Vehicle rented successfully",

        "rental_id":
            rental.id,

        "rental_days":
            rental_days,

        "total_cost":
            total_cost

    }


# =====================================================
# ACTIVE RENTALS
# =====================================================

@app.get("/rentals/active")
def get_active_rentals(

    db: Session = Depends(get_db),

    user=Depends(get_current_user)

):

    rentals = (

        db.query(Rental)

        .filter(
            Rental.status == "Active"
        )

        .all()

    )


    result = []


    for rental in rentals:

        result.append({

            "id":
                rental.id,

            "customer_name":
                rental.customer_name,

            "customer_phone":
                rental.customer_phone,

            "start_date":
                rental.start_date,

            "end_date":
                rental.end_date,

            "rental_days":
                rental.rental_days,

            "total_cost":
                rental.total_cost,

            "status":
                rental.status,

            "returned_at":
                rental.returned_at,

            "vehicle_id":
                rental.vehicle_id,

            "vehicle_name":
                rental.vehicle.name,

            "registration_number":
                rental.vehicle.registration_number

        })


    return result


# =====================================================
# RENTAL HISTORY
# =====================================================

@app.get("/rentals/history")
def get_rental_history(

    db: Session = Depends(get_db),

    user=Depends(get_current_user)

):

    rentals = (

        db.query(Rental)

        .filter(
            Rental.status == "Completed"
        )

        .order_by(
            Rental.id.desc()
        )

        .all()

    )


    result = []


    for rental in rentals:

        result.append({

            "id":
                rental.id,

            "customer_name":
                rental.customer_name,

            "customer_phone":
                rental.customer_phone,

            "start_date":
                rental.start_date,

            "end_date":
                rental.end_date,

            "rental_days":
                rental.rental_days,

            "total_cost":
                rental.total_cost,

            "status":
                rental.status,

            "returned_at":
                rental.returned_at,

            "vehicle_id":
                rental.vehicle_id,

            "vehicle_name":
                rental.vehicle.name,

            "registration_number":
                rental.vehicle.registration_number

        })


    return result


# =====================================================
# RETURN VEHICLE
# =====================================================

@app.put("/rentals/{rental_id}/return")
def return_vehicle(

    rental_id: int,

    db: Session = Depends(get_db),

    user=Depends(get_current_user)

):

    rental = (

        db.query(Rental)

        .filter(
            Rental.id == rental_id
        )

        .first()

    )


    if not rental:

        raise HTTPException(

            status_code=404,

            detail="Rental not found"

        )


    if rental.status != "Active":

        raise HTTPException(

            status_code=400,

            detail="Rental is already completed"

        )


    rental.status = "Completed"

    rental.returned_at = datetime.now()

    rental.vehicle.available = True


    db.commit()

    db.refresh(rental)


    return {

        "message":
            "Vehicle returned successfully",

        "rental_id":
            rental.id

    }


# =====================================================
# DASHBOARD
# =====================================================

@app.get("/dashboard")
def dashboard(

    db: Session = Depends(get_db),

    user=Depends(get_current_user)

):

    vehicles = (
        db.query(Vehicle).all()
    )


    rentals = (
        db.query(Rental).all()
    )


    total_vehicles = len(
        vehicles
    )


    available_vehicles = len([

        vehicle
        for vehicle in vehicles
        if vehicle.available

    ])


    rented_vehicles = (

        total_vehicles
        -
        available_vehicles

    )


    total_revenue = sum(

        rental.total_cost

        for rental in rentals

        if rental.status == "Completed"

    )


    active_revenue = sum(

        rental.total_cost

        for rental in rentals

        if rental.status == "Active"

    )


    fleet_value = sum(

        vehicle.vehicle_value

        for vehicle in vehicles

    )


    return {

        "total_vehicles":
            total_vehicles,

        "available_vehicles":
            available_vehicles,

        "rented_vehicles":
            rented_vehicles,

        "fleet_value":
            fleet_value,

        "active_revenue":
            active_revenue,

        "total_revenue":
            total_revenue

    }