document.addEventListener("DOMContentLoaded", async () => {
  const content = document.getElementById("roomMainContent");

  const params = new URLSearchParams(window.location.search);
  const roomId = params.get("id");

  if (!roomId) {
    content.innerHTML = "<p style='text-align: center; color: red;'>ოთახის ID ვერ მოიძებნა!</p>";
    return;
  }

  const token = localStorage.getItem("token");

  try {
    const [roomRes, reservedRes] = await Promise.all([
      fetch(`https://bookingapi.stepacademy.ge/api/rooms/details/${roomId}`, {
        headers: { "accept": "application/json" }
      }),
      fetch(`https://bookingapi.stepacademy.ge/api/rooms/reserved/${roomId}`, {
        headers: { "accept": "application/json" }
      })
    ]);

    if (!roomRes.ok) throw new Error("Room not found");

    const result = await roomRes.json();
    const room = result.data;
    const hotel = room.hotel;

    let reservedData = [];
    if (reservedRes.ok) {
      const resJson = await reservedRes.json();
      reservedData = resJson.data || [];
    }

    const galleryHtml = (room.gallery || [])
      .map(img => `<img src="${img}" alt="${room.roomType}" class="gallery-side-img">`)
      .join("");

    let starsHtml = "";
    for (let i = 0; i < 5; i++) {
      starsHtml += i < Math.floor(room.averageRating || 0)
        ? '<i class="fa-solid fa-star"></i>'
        : '<i class="fa-regular fa-star"></i>';
    }

    const specs = room.specifications || {};
    let specsHtml = "";
    for (const [key, value] of Object.entries(specs)) {
      specsHtml += `
        <div class="spec-row">
          <span class="spec-key">${key}:</span>
          <span class="spec-val">${value}</span>
        </div>
      `;
    }

    let reservedDatesHtml = "";
    if (reservedData.length > 0) {
      reservedDatesHtml = reservedData.map(item => {
        const checkIn = item.checkInDate.split("T")[0];
        const checkOut = item.checkOutDate.split("T")[0];
        return `<span class="reserved-pill"><i class="fa-regular fa-calendar-xmark"></i> ${checkIn} -დან ${checkOut} -მდე</span>`;
      }).join("");
    } else {
      reservedDatesHtml = '<span style="color: #10b981; font-size: 0.85rem;"><i class="fa-regular fa-calendar-check"></i> ოთახი თავისუფალია</span>';
    }

    const bookingActionHtml = token
      ? `
        <div class="date-pickers" style="margin-bottom: 20px;">
          <div style="margin-bottom: 10px;">
            <label style="font-size: 0.8rem; color: #64748b; display: block; margin-bottom: 4px;">Check-In</label>
            <input type="date" id="bookCheckIn" class="date-input">
          </div>
          <div>
            <label style="font-size: 0.8rem; color: #64748b; display: block; margin-bottom: 4px;">Check-Out</label>
            <input type="date" id="bookCheckOut" class="date-input">
          </div>
        </div>
        <button class="btn btn-primary btn-book-action" onclick="handleBookAction(${room.id})">Book Now</button>
      `
      : `<a href="login.html" class="btn btn-primary btn-book-action">Login to book</a>`;

    const reviewActionHtml = token
      ? `<button class="btn btn-primary btn-sm" onclick="writeReview(${room.id})">Write a Review</button>`
      : `<a href="login.html" class="btn btn-primary btn-sm">Login to Write a Review</a>`;

    content.innerHTML = `
      <section class="hotel-gallery-grid">
        <div class="main-image-wrapper">
          <img src="${room.thumbnail}" alt="${room.roomType}" class="main-hotel-img">
        </div>
        <div class="side-images-wrapper">
          ${galleryHtml}
        </div>
      </section>

      <div class="room-details-layout">
        <div class="room-main-info">
          <div class="room-back-link">
            <a href="hotel.html?id=${hotel.id}">← ${hotel.name}</a>
          </div>

          <div class="room-title-row">
            <h1 class="room-heading">${room.roomType}</h1>
            ${room.isAvailable ? '<span class="badge-available-pill">Available</span>' : ''}
          </div>

          <div class="room-sub-id">Room #${room.roomNumber}</div>

          <div class="room-metrics-bar">
            <div class="metric-item">
              <span class="metric-label">CAPACITY</span>
              <span class="metric-value">${room.capacity} guests</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">BEDS</span>
              <span class="metric-value">${room.bedCount}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">RATING</span>
              <span class="metric-value">
                <span class="stars-gold">${starsHtml}</span>
                <span class="metric-num">${Number(room.averageRating).toFixed(1)}</span>
              </span>
            </div>
            <div class="metric-item">
              <span class="metric-label">REVIEWS</span>
              <span class="metric-value">${room.reviewCount}</span>
            </div>
          </div>

          <div class="specs-section">
            <h2 class="specs-heading">Specifications</h2>
            <div class="specs-table">
              ${specsHtml}
            </div>
          </div>

          <div class="reviews-section">
            <div class="reviews-header">
              <h2 class="specs-heading">Guest Reviews</h2>
              ${reviewActionHtml}
            </div>
            <p class="no-reviews-text">No reviews yet — be the first to share your experience!</p>
          </div>
        </div>

        <div class="room-sidebar">
          <div class="booking-card">
            <div class="price-header">
              <span class="price-amount">$${room.pricePerNight}</span>
              <span class="price-sub">/ night</span>
            </div>

            <div class="reserved-dates-box" style="margin-bottom: 16px;">
              <label>დაკავებული თარიღები:</label>
              <div class="reserved-list">
                ${reservedDatesHtml}
              </div>
            </div>

            ${bookingActionHtml}
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error(error);
    content.innerHTML = "<p style='text-align: center; color: red;'>ოთახის მონაცემების წამოღება ვერ მოხერხდა.</p>";
  }
});

function handleBookAction(roomId) {
  const checkIn = document.getElementById("bookCheckIn").value;
  const checkOut = document.getElementById("bookCheckOut").value;

  if (!checkIn || !checkOut) {
    alert("გთხოვთ აირჩიოთ Check-In და Check-Out თარიღები!");
    return;
  }

  alert(`ოთახი #${roomId} წარმატებით დაიჯავშნა: ${checkIn}-დან ${checkOut}-მდე!`);
}

function writeReview(roomId) {
  alert("შეფასების დაწერა ოთახზე: " + roomId);
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