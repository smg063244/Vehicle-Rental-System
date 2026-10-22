const API = window.location.port === "5500"
    ? "http://127.0.0.1:8000"
    : window.location.origin;

let token = localStorage.getItem("token");

// =====================================================
// HELPERS
// =====================================================

function authHeaders() {
    return {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    };
}

async function getJson(response) {
    const text = await response.text();

    if (!text) {
        return {};
    }

    try {
        return JSON.parse(text);
    } catch {
        return {
            detail: text
        };
    }
}

async function apiFetch(url, options = {}) {

    if (!token) {
        showLogin();
        throw new Error("Not logged in");
    }

    options.headers = {
        ...authHeaders(),
        ...(options.headers || {})
    };

    const response = await fetch(url, options);

    if (response.status === 401) {

        localStorage.removeItem("token");
        token = null;

        alert("Session expired. Please login again.");

        showLogin();

        throw new Error("Unauthorized");
    }

    return response;
}


// =====================================================
// LOGIN
// =====================================================

async function login(event) {

    event.preventDefault();

    const username =
        document.getElementById("username").value.trim();

    const password =
        document.getElementById("password").value;

    const loginError =
        document.getElementById("loginError");

    loginError.textContent = "";

    try {

        const formData = new URLSearchParams();

        formData.append("username", username);
        formData.append("password", password);

        const response = await fetch(
            `${API}/login`,
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded"
                },
                body: formData
            }
        );

        const data = await getJson(response);

        if (!response.ok) {

            loginError.textContent =
                data.detail ||
                "Invalid username or password.";

            return;
        }

        token = data.access_token;

        localStorage.setItem("token", token);

        console.log("Login successful");

        showApp();

        await loadDashboard();
        await loadVehicles();
        await loadRentalVehicles();
        await loadActiveRentals();
        await loadRentalHistory();

    }

    catch (error) {

        console.error(error);

        loginError.textContent =
            "Cannot connect to backend.";
    }
}


// =====================================================
// LOGIN / APP DISPLAY
// =====================================================

function showLogin() {

    document
        .getElementById("loginPage")
        .classList.remove("hidden");

    document
        .getElementById("appPage")
        .classList.add("hidden");
}

function showApp() {

    document
        .getElementById("loginPage")
        .classList.add("hidden");

    document
        .getElementById("appPage")
        .classList.remove("hidden");
}


// =====================================================
// LOGOUT
// =====================================================

function logout() {

    localStorage.removeItem("token");

    token = null;

    showLogin();
}


// =====================================================
// DASHBOARD
// =====================================================

async function loadDashboard() {

    try {

        const response =
            await apiFetch(`${API}/dashboard`);

        const data =
            await getJson(response);

        document.getElementById(
            "totalVehicles"
        ).textContent =
            data.total_vehicles ?? 0;

        document.getElementById(
            "availableVehicles"
        ).textContent =
            data.available_vehicles ?? 0;

        document.getElementById(
            "rentedVehicles"
        ).textContent =
            data.rented_vehicles ?? 0;

        document.getElementById(
            "fleetValue"
        ).textContent =
            `₹${Number(
                data.fleet_value || 0
            ).toLocaleString("en-IN")}`;

        document.getElementById(
            "activeRevenue"
        ).textContent =
            `₹${Number(
                data.active_revenue || 0
            ).toFixed(2)}`;

        document.getElementById(
            "totalRevenue"
        ).textContent =
            `₹${Number(
                data.total_revenue || 0
            ).toFixed(2)}`;

    }

    catch (error) {

        console.error(
            "Dashboard error:",
            error
        );
    }
}


// =====================================================
// LOAD VEHICLES
// =====================================================

async function loadVehicles() {

    try {

        const response =
            await apiFetch(`${API}/vehicles`);

        const vehicles =
            await getJson(response);

        const grid =
            document.getElementById("vehicleGrid");

        grid.innerHTML = "";

        if (
            !Array.isArray(vehicles) ||
            vehicles.length === 0
        ) {

            grid.innerHTML = `
                <div class="empty-message">
                    No vehicles available.
                </div>
            `;

            return;
        }

        vehicles.forEach(vehicle => {

            const card =
                document.createElement("div");

            card.className =
                "vehicle-card";

            card.innerHTML = `

                <div class="vehicle-info">

                    <h3>
                        ${escapeHtml(vehicle.name)}
                    </h3>

                    <p>
                        <strong>Type:</strong>
                        ${escapeHtml(vehicle.vehicle_type)}
                    </p>

                    <p>
                        <strong>Registration:</strong>
                        ${escapeHtml(vehicle.registration_number)}
                    </p>

                    <p>
                        <strong>Vehicle Value:</strong>
                        ₹${Number(
                            vehicle.vehicle_value
                        ).toLocaleString("en-IN")}
                    </p>

                    <p>
                        <strong>Rent / Day:</strong>
                        ₹${Number(
                            vehicle.rent_per_day
                        ).toFixed(2)}
                    </p>

                    <p>
                        <strong>Status:</strong>

                        <span class="${
                            vehicle.available
                                ? "available"
                                : "rented"
                        }">

                            ${
                                vehicle.available
                                    ? "Available"
                                    : "Currently Rented"
                            }

                        </span>

                    </p>

                </div>

                <div class="vehicle-actions">

                    ${
                        vehicle.available
                            ?
                            `
                            <button
                                class="rent-btn"
                                onclick="openRentForm(${vehicle.id})"
                            >
                                🚗 Rent
                            </button>
                            `
                            :
                            `
                            <button
                                class="rent-btn"
                                disabled
                            >
                                Rented
                            </button>
                            `
                    }

                    <button
                        class="delete-btn"
                        onclick="deleteVehicle(${vehicle.id})"
                        ${
                            vehicle.available
                                ? ""
                                : "disabled"
                        }
                    >
                        🗑️ Delete
                    </button>

                </div>
            `;

            grid.appendChild(card);

        });

    }

    catch (error) {

        console.error(
            "Vehicle error:",
            error
        );
    }
}


// =====================================================
// DELETE VEHICLE
// =====================================================

async function deleteVehicle(vehicleId) {

    if (!token) {

        alert("Please login again.");

        showLogin();

        return;
    }

    const confirmed =
        confirm(
            "Are you sure you want to delete this vehicle?"
        );

    if (!confirmed) {
        return;
    }

    try {

        const response =
            await fetch(
                `${API}/vehicles/${vehicleId}`,
                {
                    method: "DELETE",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        const data =
            await getJson(response);

        if (response.status === 401) {

            localStorage.removeItem("token");

            token = null;

            showLogin();

            alert(
                "Session expired. Please login again."
            );

            return;
        }

        if (!response.ok) {

            alert(
                data.detail ||
                "Delete failed."
            );

            return;
        }

        alert(
            "Vehicle deleted successfully!"
        );

        await loadVehicles();
        await loadDashboard();
        await loadRentalVehicles();

    }

    catch (error) {

        console.error(error);

        alert(
            "Cannot connect to backend."
        );
    }
}


// =====================================================
// ADD VEHICLE
// =====================================================

async function addVehicle(event) {

    event.preventDefault();

    const data = {

        name:
            document.getElementById(
                "vehicleName"
            ).value.trim(),

        vehicle_type:
            document.getElementById(
                "vehicleType"
            ).value,

        registration_number:
            document.getElementById(
                "registrationNumber"
            ).value.trim(),

        vehicle_value:
            Number(
                document.getElementById(
                    "vehicleValue"
                ).value
            ),

        rent_per_day:
            Number(
                document.getElementById(
                    "rentPerDayInput"
                ).value
            )
    };

    try {

        const response =
            await apiFetch(
                `${API}/vehicles`,
                {
                    method: "POST",

                    body:
                        JSON.stringify(data)
                }
            );

        const result =
            await getJson(response);

        if (!response.ok) {

            alert(
                result.detail ||
                "Unable to add vehicle."
            );

            return;
        }

        alert(
            "Vehicle added successfully!"
        );

        document
            .getElementById("vehicleForm")
            .reset();

        closeVehicleModal();

        await loadVehicles();
        await loadDashboard();
        await loadRentalVehicles();

    }

    catch (error) {

        console.error(error);

        alert(
            "Cannot connect to backend."
        );
    }
}


// =====================================================
// VEHICLE MODAL
// =====================================================

function openVehicleModal() {

    document
        .getElementById("vehicleModal")
        .classList.remove("hidden");
}

function closeVehicleModal() {

    document
        .getElementById("vehicleModal")
        .classList.add("hidden");
}


// =====================================================
// RENT VEHICLE LIST
// =====================================================

async function loadRentalVehicles() {

    try {

        const response =
            await apiFetch(`${API}/vehicles`);

        const vehicles =
            await getJson(response);

        const select =
            document.getElementById("rentalVehicle");

        select.innerHTML = `
            <option value="">
                Select vehicle
            </option>
        `;

        vehicles
            .filter(
                vehicle =>
                    vehicle.available
            )
            .forEach(vehicle => {

                const option =
                    document.createElement("option");

                option.value =
                    vehicle.id;

                option.textContent =
                    `${vehicle.name} - ${
                        vehicle.registration_number
                    } - ₹${
                        vehicle.rent_per_day
                    }/day`;

                option.dataset.rent =
                    vehicle.rent_per_day;

                select.appendChild(option);
            });

    }

    catch (error) {

        console.error(error);
    }
}


// =====================================================
// RENT FORM
// =====================================================

function openRentForm(vehicleId) {

    showSection("rentSection");

    document
        .querySelectorAll(".nav-btn")
        .forEach(button => {

            button.classList.remove("active");

            if (
                button.dataset.section ===
                "rentSection"
            ) {

                button.classList.add("active");
            }
        });

    const select =
        document.getElementById(
            "rentalVehicle"
        );

    select.value =
        vehicleId;

    updateRentalPreview();
}


async function rentVehicle(event) {

    event.preventDefault();

    const vehicleId =
        Number(
            document.getElementById(
                "rentalVehicle"
            ).value
        );

    const customerName =
        document.getElementById(
            "customerName"
        ).value.trim();

    const customerPhone =
        document.getElementById(
            "customerPhone"
        ).value.trim();

    const startDate =
        document.getElementById(
            "startDate"
        ).value;

    const endDate =
        document.getElementById(
            "endDate"
        ).value;

    if (
        !vehicleId ||
        !customerName ||
        !customerPhone ||
        !startDate ||
        !endDate
    ) {

        alert(
            "Please fill all details."
        );

        return;
    }

    if (endDate < startDate) {

        alert(
            "End date cannot be before start date."
        );

        return;
    }

    try {

        const response =
            await apiFetch(
                `${API}/rentals`,
                {
                    method: "POST",

                    body:
                        JSON.stringify({

                            vehicle_id:
                                vehicleId,

                            customer_name:
                                customerName,

                            customer_phone:
                                customerPhone,

                            start_date:
                                startDate,

                            end_date:
                                endDate
                        })
                }
            );

        const data =
            await getJson(response);

        if (!response.ok) {

            alert(
                data.detail ||
                "Rental failed."
            );

            return;
        }

        alert(
            "Vehicle rented successfully!"
        );

        document
            .getElementById("rentalForm")
            .reset();

        updateRentalPreview();

        await loadVehicles();
        await loadDashboard();
        await loadRentalVehicles();
        await loadActiveRentals();
        await loadRentalHistory();

    }

    catch (error) {

        console.error(error);

        alert(
            "Cannot connect to backend."
        );
    }
}


// =====================================================
// RENTAL PREVIEW
// =====================================================

function updateRentalPreview() {

    const select =
        document.getElementById(
            "rentalVehicle"
        );

    const start =
        document.getElementById(
            "startDate"
        ).value;

    const end =
        document.getElementById(
            "endDate"
        ).value;

    const option =
        select.options[
            select.selectedIndex
        ];

    const rent =
        Number(
            option?.dataset?.rent || 0
        );

    let days = 0;

    if (start && end) {

        const startDate =
            new Date(start);

        const endDate =
            new Date(end);

        days =
            Math.ceil(
                (
                    endDate -
                    startDate
                ) /
                (
                    1000 *
                    60 *
                    60 *
                    24
                )
            );

        if (days <= 0) {
            days = 1;
        }
    }

    document.getElementById(
        "rentalDays"
    ).textContent =
        `${days} day${days === 1 ? "" : "s"}`;

    document.getElementById(
        "rentPerDay"
    ).textContent =
        `₹${rent.toFixed(2)}`;

    document.getElementById(
        "totalCost"
    ).textContent =
        `₹${(
            days * rent
        ).toFixed(2)}`;
}


// =====================================================
// ACTIVE RENTALS
// =====================================================

async function loadActiveRentals() {

    try {

        const response =
            await apiFetch(
                `${API}/rentals/active`
            );

        const rentals =
            await getJson(response);

        const container =
            document.getElementById(
                "activeRentals"
            );

        container.innerHTML = "";

        if (!rentals.length) {

            container.innerHTML = `
                <div class="empty-message">
                    No active rentals.
                </div>
            `;

            return;
        }

        rentals.forEach(rental => {

            const card =
                document.createElement("div");

            card.className =
                "rental-card";

            card.innerHTML = `

                <h3>
                    ${escapeHtml(
                        rental.vehicle_name
                    )}
                </h3>

                <p>
                    <strong>
                        Registration:
                    </strong>

                    ${escapeHtml(
                        rental.registration_number
                    )}
                </p>

                <p>
                    <strong>
                        Customer:
                    </strong>

                    ${escapeHtml(
                        rental.customer_name
                    )}
                </p>

                <p>
                    <strong>
                        Phone:
                    </strong>

                    ${escapeHtml(
                        rental.customer_phone
                    )}
                </p>

                <p>
                    <strong>
                        Start:
                    </strong>

                    ${rental.start_date}
                </p>

                <p>
                    <strong>
                        End:
                    </strong>

                    ${rental.end_date}
                </p>

                <p>
                    <strong>
                        Days:
                    </strong>

                    ${rental.rental_days}
                </p>

                <p>
                    <strong>
                        Total:
                    </strong>

                    ₹${Number(
                        rental.total_cost
                    ).toFixed(2)}
                </p>

                <button
                    class="return-btn"
                    onclick="returnVehicle(${rental.id})"
                >
                    🔄 Return Vehicle
                </button>

            `;

            container.appendChild(card);
        });

    }

    catch (error) {

        console.error(error);
    }
}


// =====================================================
// RETURN VEHICLE
// =====================================================

async function returnVehicle(rentalId) {

    if (
        !confirm(
            "Return this vehicle?"
        )
    ) {
        return;
    }

    try {

        const response =
            await apiFetch(
                `${API}/rentals/${rentalId}/return`,
                {
                    method: "PUT"
                }
            );

        const data =
            await getJson(response);

        if (!response.ok) {

            alert(
                data.detail ||
                "Return failed."
            );

            return;
        }

        alert(
            "Vehicle returned successfully!"
        );

        await loadVehicles();
        await loadDashboard();
        await loadRentalVehicles();
        await loadActiveRentals();
        await loadRentalHistory();

    }

    catch (error) {

        console.error(error);

        alert(
            "Cannot connect to backend."
        );
    }
}


// =====================================================
// HISTORY
// =====================================================

async function loadRentalHistory() {

    try {

        const response =
            await apiFetch(
                `${API}/rentals/history`
            );

        const rentals =
            await getJson(response);

        const container =
            document.getElementById(
                "historyRentals"
            );

        container.innerHTML = "";

        if (!rentals.length) {

            container.innerHTML = `
                <div class="empty-message">
                    No rental history.
                </div>
            `;

            return;
        }

        rentals.forEach(rental => {

            const card =
                document.createElement("div");

            card.className =
                "rental-card";

            card.innerHTML = `

                <h3>
                    ${escapeHtml(
                        rental.vehicle_name
                    )}
                </h3>

                <p>
                    <strong>
                        Registration:
                    </strong>

                    ${escapeHtml(
                        rental.registration_number
                    )}
                </p>

                <p>
                    <strong>
                        Customer:
                    </strong>

                    ${escapeHtml(
                        rental.customer_name
                    )}
                </p>

                <p>
                    <strong>
                        Phone:
                    </strong>

                    ${escapeHtml(
                        rental.customer_phone
                    )}
                </p>

                <p>
                    <strong>
                        Start:
                    </strong>

                    ${rental.start_date}
                </p>

                <p>
                    <strong>
                        End:
                    </strong>

                    ${rental.end_date}
                </p>

                <p>
                    <strong>
                        Days:
                    </strong>

                    ${rental.rental_days}
                </p>

                <p>
                    <strong>
                        Total:
                    </strong>

                    ₹${Number(
                        rental.total_cost
                    ).toFixed(2)}
                </p>

                <p>
                    <strong>
                        Status:
                    </strong>

                    ${escapeHtml(
                        rental.status
                    )}
                </p>

                <p>
                    <strong>
                        Returned:
                    </strong>

                    ${rental.returned_at || "-"}
                </p>

            `;

            container.appendChild(card);
        });

    }

    catch (error) {

        console.error(error);
    }
}


// =====================================================
// NAVIGATION
// =====================================================

function showSection(sectionId) {

    document
        .querySelectorAll(".section")
        .forEach(section => {

            section.classList.remove(
                "active-section"
            );
        });

    const section =
        document.getElementById(sectionId);

    if (section) {

        section.classList.add(
            "active-section"
        );
    }

    const titles = {

        dashboardSection:
            "Dashboard",

        vehiclesSection:
            "Vehicles",

        rentSection:
            "Rent a Vehicle",

        activeSection:
            "Active Rentals",

        historySection:
            "Rental History"
    };

    document.getElementById(
        "pageTitle"
    ).textContent =
        titles[sectionId] ||
        "Dashboard";
}


// =====================================================
// HTML ESCAPE
// =====================================================

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );
}


// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        // LOGIN
        document
            .getElementById("loginForm")
            .addEventListener(
                "submit",
                login
            );


        // VEHICLE FORM
        document
            .getElementById("vehicleForm")
            .addEventListener(
                "submit",
                addVehicle
            );


        // RENTAL FORM
        document
            .getElementById("rentalForm")
            .addEventListener(
                "submit",
                rentVehicle
            );


        // LOGOUT
        document
            .getElementById("logoutBtn")
            .addEventListener(
                "click",
                logout
            );


        // NAVIGATION
        document
            .querySelectorAll(".nav-btn")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    async function () {

                        document
                            .querySelectorAll(".nav-btn")
                            .forEach(btn =>
                                btn.classList.remove(
                                    "active"
                                )
                            );

                        this.classList.add(
                            "active"
                        );

                        const section =
                            this.dataset.section;

                        showSection(section);


                        if (
                            section ===
                            "dashboardSection"
                        ) {

                            await loadDashboard();
                        }


                        if (
                            section ===
                            "vehiclesSection"
                        ) {

                            await loadVehicles();
                        }


                        if (
                            section ===
                            "rentSection"
                        ) {

                            await loadRentalVehicles();
                        }


                        if (
                            section ===
                            "activeSection"
                        ) {

                            await loadActiveRentals();
                        }


                        if (
                            section ===
                            "historySection"
                        ) {

                            await loadRentalHistory();
                        }

                    }
                );

            });


        // RENTAL PREVIEW
        document
            .getElementById("rentalVehicle")
            .addEventListener(
                "change",
                updateRentalPreview
            );


        document
            .getElementById("startDate")
            .addEventListener(
                "change",
                updateRentalPreview
            );


        document
            .getElementById("endDate")
            .addEventListener(
                "change",
                updateRentalPreview
            );


        // CHECK TOKEN
        if (token) {

            try {

                const response =
                    await fetch(
                        `${API}/me`,
                        {
                            headers: {
                                "Authorization":
                                    `Bearer ${token}`
                            }
                        }
                    );

                if (response.ok) {

                    showApp();

                    await loadDashboard();
                    await loadVehicles();
                    await loadRentalVehicles();
                    await loadActiveRentals();
                    await loadRentalHistory();

                }

                else {

                    localStorage.removeItem(
                        "token"
                    );

                    token = null;

                    showLogin();
                }

            }

            catch {

                showLogin();
            }

        }

        else {

            showLogin();
        }

    }
);