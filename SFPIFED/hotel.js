document.addEventListener("DOMContentLoaded", async () => {
  const content = document.getElementById("hotelMainContent");

  const params = new URLSearchParams(window.location.search);
  const hotelId = params.get("id");

  if (!hotelId) {
    content.innerHTML = "<p style='text-align: center; color: red;'>სასტუმროს ID ვერ მოიძებნა!</p>";
    return;
  }

  try {
    const hotelRes = await fetch(`https://bookingapi.stepacademy.ge/api/hotels/${hotelId}`, {
      headers: { "accept": "application/json" }
    });

    if (!hotelRes.ok) throw new Error("Hotel not found");

    const hotelData = await hotelRes.json();
    const hotel = hotelData.data;

    const galleryHtml = (hotel.gallery || [])
      .slice(0, 3)
      .map(img => `<img src="${img}" alt="${hotel.name}" class="gallery-side-img">`)
      .join("");

    let starsHtml = "";
    for (let i = 0; i < 5; i++) {
      starsHtml += i < Math.floor(hotel.averageRating || 0)
        ? '<i class="fa-solid fa-star"></i>'
        : '<i class="fa-regular fa-star"></i>';
    }

    const addr = hotel.address;
    const addressText = `${addr.city || ''}, ${addr.country || ''}${addr.state ? ', ' + addr.state : ''}, ${addr.street || ''}, ${addr.zipCode || ''}`;

    content.innerHTML = `
      <section class="hotel-gallery-grid">
        <div class="main-image-wrapper">
          <img src="${hotel.thumbnail}" alt="${hotel.name}" class="main-hotel-img">
        </div>
        <div class="side-images-wrapper">
          ${galleryHtml}
        </div>
      </section>

      <section class="hotel-info-section">
        <div class="hotel-details-left">
          <span class="hotel-tag">${hotel.starRating} ★ Hotel</span>
          <h1 class="hotel-page-title">${hotel.name}</h1>
          <p class="hotel-location-text">${addressText}</p>
          
          <div class="hotel-rating-row">
            <span class="stars-gold">${starsHtml}</span>
            <span class="rating-num">${Number(hotel.averageRating).toFixed(1)} (${hotel.reviewCount} reviews)</span>
            <span class="room-count-badge">${hotel.roomCount} rooms</span>
          </div>

          <p class="hotel-description-text">${hotel.description}</p>
        </div>

        <div class="hotel-contact-card">
          <h3>Contact</h3>
          <p><i class="fa-solid fa-phone"></i> ${hotel.phoneNumber || "N/A"}</p>
          <p><i class="fa-solid fa-envelope"></i> ${hotel.email || "N/A"}</p>
        </div>
      </section>

      <section class="rooms-section">
        <div class="rooms-tabs-header">
          <button class="rooms-tab-btn active">Rooms (<span id="roomsTotalBadge">${hotel.roomCount}</span>)</button>
          <button class="rooms-tab-btn">Reviews (${hotel.reviewCount})</button>
        </div>

        <div class="rooms-controls-bar">
          <button id="roomFilterToggleBtn" class="room-filter-toggle">
            <i class="fa-solid fa-sliders"></i> Filters
          </button>
        </div>

        <div id="roomFilterPanel" class="room-filter-panel hidden">
          <div class="room-filter-grid">
            <div class="filter-field">
              <label>Room Type</label>
              <select id="roomTypeSelect">
                <option value="">All Types</option>
                <option value="0">Standard</option>
                <option value="1">Deluxe</option>
                <option value="2">Penthouse</option>
                <option value="3">FamilySuite</option>
                <option value="4">Accessible</option>
              </select>
            </div>

            <div class="filter-field">
              <label>Min Price ($)</label>
              <input type="number" id="minPriceInput" placeholder="Min">
            </div>

            <div class="filter-field">
              <label>Max Price ($)</label>
              <input type="number" id="maxPriceInput" placeholder="Max">
            </div>

            <div class="filter-field">
              <label>Capacity</label>
              <select id="capacitySelect">
                <option value="">Any</option>
                <option value="1">1 Person</option>
                <option value="2">2 Persons</option>
                <option value="3">3 Persons</option>
                <option value="4">4+ Persons</option>
              </select>
            </div>

            <div class="filter-field">
              <label>Availability</label>
              <select id="availableSelect">
                <option value="">All</option>
                <option value="true">Available</option>
                <option value="false">Booked</option>
              </select>
            </div>

            <div class="filter-field" style="justify-content: flex-end;">
              <button id="resetRoomFiltersBtn" class="btn-clear-rooms">Reset</button>
            </div>
          </div>
        </div>

        <div class="rooms-grid" id="roomsGridContainer"></div>
      </section>
    `;

    const roomsContainer = document.getElementById("roomsGridContainer");
    const roomsTotalBadge = document.getElementById("roomsTotalBadge");
    const roomFilterToggleBtn = document.getElementById("roomFilterToggleBtn");
    const roomFilterPanel = document.getElementById("roomFilterPanel");

    const roomTypeSelect = document.getElementById("roomTypeSelect");
    const minPriceInput = document.getElementById("minPriceInput");
    const maxPriceInput = document.getElementById("maxPriceInput");
    const capacitySelect = document.getElementById("capacitySelect");
    const availableSelect = document.getElementById("availableSelect");
    const resetRoomFiltersBtn = document.getElementById("resetRoomFiltersBtn");

    roomFilterToggleBtn.addEventListener("click", () => {
      roomFilterPanel.classList.toggle("hidden");
    });

    function renderRoomsList(rooms) {
      roomsContainer.innerHTML = "";
      roomsTotalBadge.textContent = rooms.length;

      if (!rooms || rooms.length === 0) {
        roomsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #64748b;">ოთახები ვერ მოიძებნა.</p>';
        return;
      }

      rooms.forEach(room => {
        let roomStars = "";
        for (let i = 0; i < 5; i++) {
          roomStars += i < Math.floor(room.averageRating || 0)
            ? '<i class="fa-solid fa-star"></i>'
            : '<i class="fa-regular fa-star"></i>';
        }

        const roomCard = document.createElement("div");
        roomCard.className = "room-card";
        roomCard.innerHTML = `
          <div class="room-img-wrapper">
            <img src="${room.thumbnail}" alt="${room.roomType}" class="room-img">
            ${room.isAvailable ? '<span class="badge-available">Available</span>' : ''}
          </div>
          <div class="room-body">
            <div class="room-header-row">
              <h3 class="room-type">${room.roomType}</h3>
              <span class="room-num">#${room.roomNumber}</span>
            </div>
            <div class="room-specs">
              <span><i class="fa-solid fa-user"></i> ${room.capacity}</span>
              <span><i class="fa-solid fa-bed"></i> ${room.bedCount}</span>
              <span class="room-stars">${roomStars}</span>
            </div>
            <div class="room-price-row">
              <span class="price-val">$${room.pricePerNight}</span>
              <span class="price-period">/ night</span>
            </div>
            <button class="btn btn-primary btn-book" onclick="bookRoom(${room.id})">Book Now</button>
          </div>
        `;
        roomsContainer.appendChild(roomCard);
      });
    }

    async function fetchFilteredRooms() {
      roomsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">იტვირთება ოთახები...</p>';

      const queryParams = new URLSearchParams();
      queryParams.append("HotelId", hotelId);
      queryParams.append("Take", "10");
      queryParams.append("Page", "1");

      if (roomTypeSelect.value !== "") queryParams.append("RoomType", roomTypeSelect.value);
      if (minPriceInput.value) queryParams.append("MinPrice", minPriceInput.value);
      if (maxPriceInput.value) queryParams.append("MaxPrice", maxPriceInput.value);
      if (capacitySelect.value) queryParams.append("MinCapacity", capacitySelect.value);
      if (availableSelect.value !== "") queryParams.append("IsAvailable", availableSelect.value);

      try {
        const res = await fetch(`https://bookingapi.stepacademy.ge/api/rooms/filter?${queryParams.toString()}`, {
          headers: { "accept": "application/json" }
        });
        const data = await res.json();
        renderRoomsList((data && data.data && data.data.items) ? data.data.items : []);
      } catch (err) {
        console.error(err);
        roomsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: red;">შეცდომა ოთახების გაფილტვრისას.</p>';
      }
    }

    roomTypeSelect.addEventListener("change", fetchFilteredRooms);
    minPriceInput.addEventListener("input", fetchFilteredRooms);
    maxPriceInput.addEventListener("input", fetchFilteredRooms);
    capacitySelect.addEventListener("change", fetchFilteredRooms);
    availableSelect.addEventListener("change", fetchFilteredRooms);

    resetRoomFiltersBtn.addEventListener("click", () => {
      roomTypeSelect.value = "";
      minPriceInput.value = "";
      maxPriceInput.value = "";
      capacitySelect.value = "";
      availableSelect.value = "";
      fetchFilteredRooms();
    });

    fetchFilteredRooms();
  } catch (error) {
    console.error(error);
    content.innerHTML = "<p style='text-align: center; color: red;'>სასტუმროს ჩატვირთვა ვერ მოხერხდა.</p>";
  }
});

function bookRoom(roomId) {
  window.location.href = `room.html?id=${roomId}`;
}


function renderNavbarAuth() {
  const navAuth = document.getElementById("navAuth");
  if (!navAuth) return;

  const token = localStorage.getItem("token");

  if (!token) {
    navAuth.innerHTML = '<a href="login.html" class="btn btn-primary btn-sm">Sign In</a>';
    return;
  }

  let initials = "SS";

  try {
    const payloadBase64 = token.split(".")[1];
    const decodedJson = JSON.parse(atob(payloadBase64));
    const fullName = decodedJson.name || decodedJson["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || "User";

    const parts = fullName.trim().split(" ");
    if (parts.length >= 2) {
      initials = (parts[0][0] + parts[1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length > 0) {
      initials = parts[0].substring(0, 2).toUpperCase();
    }
  } catch (e) {
    initials = "SS";
  }

  navAuth.innerHTML = `
    <a href="profile.html" class="user-avatar-btn">${initials}</a>
  `;
}

renderNavbarAuth();