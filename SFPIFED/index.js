const savedHotelsMap = new Map();

document.addEventListener("DOMContentLoaded", async () => {
  renderNavbarAuth();

  let allHotels = [];
  const hotelsGrid = document.getElementById("hotelsGrid");
  const filterToggleBtn = document.getElementById("filterToggleBtn");
  const filterPanel = document.getElementById("filterPanel");
  const filterCountBadge = document.getElementById("filterCountBadge");
  const activeTagsRow = document.getElementById("activeTagsRow");
  const tagsList = document.getElementById("tagsList");
  const clearAllBtn = document.getElementById("clearAllBtn");

  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");

  const countryFilter = document.getElementById("countryFilter");
  const cityFilter = document.getElementById("cityFilter");
  const starsFilter = document.getElementById("starsFilter");
  const ratingFilter = document.getElementById("ratingFilter");
  const sortBy = document.getElementById("sortBy");

  async function loadUserSaves() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch("https://bookingapi.stepacademy.ge/api/saves/hotels", {
        headers: {
          "accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const json = await res.json();
        const items = json.items || json.data || [];
        savedHotelsMap.clear();
        items.forEach(h => {
          savedHotelsMap.set(Number(h.id), h.saveId || h.id);
        });
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function loadHotels() {
    try {
      await loadUserSaves();

      const res = await fetch("https://bookingapi.stepacademy.ge/api/hotels", {
        headers: { "accept": "application/json" }
      });

      if (!res.ok) throw new Error("HTTP Error " + res.status);

      const json = await res.json();

      if (json && json.data && Array.isArray(json.data.items)) {
        allHotels = json.data.items;
      } else if (json && Array.isArray(json.data)) {
        allHotels = json.data;
      } else if (Array.isArray(json)) {
        allHotels = json;
      } else {
        allHotels = [];
      }

      renderHotels(allHotels);
    } catch (err) {
      console.error(err);
      if (hotelsGrid) {
        hotelsGrid.innerHTML = "<p style='color: red;'>სასტუმროების ჩატვირთვა ვერ მოხერხდა.</p>";
      }
    }
  }

  loadHotels();

  if (filterToggleBtn && filterPanel) {
    filterToggleBtn.addEventListener("click", () => {
      filterPanel.classList.toggle("hidden");
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener("click", applyFilters);
  }
  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") applyFilters();
    });
  }

  if (countryFilter) countryFilter.addEventListener("change", applyFilters);
  if (cityFilter) cityFilter.addEventListener("change", applyFilters);
  if (starsFilter) starsFilter.addEventListener("change", applyFilters);
  if (ratingFilter) ratingFilter.addEventListener("change", applyFilters);
  if (sortBy) sortBy.addEventListener("change", applyFilters);

  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      if (countryFilter) countryFilter.value = "";
      if (cityFilter) cityFilter.value = "";
      if (starsFilter) starsFilter.value = "";
      if (ratingFilter) ratingFilter.value = "";
      if (sortBy) sortBy.value = "";
      applyFilters();
    });
  }

  function renderHotels(hotels) {
    if (!hotelsGrid) return;
    if (!Array.isArray(hotels) || hotels.length === 0) {
      hotelsGrid.innerHTML = "<p style='color: #64748b;'>სასტუმროები ვერ მოიძებნა.</p>";
      return;
    }

    hotelsGrid.innerHTML = hotels.map(hotel => {
      const isSaved = savedHotelsMap.has(Number(hotel.id));

      return `
        <div class="hotel-card-wrapper" style="position: relative;">
          <a href="hotel.html?id=${hotel.id}" class="hotel-card">
            <div class="card-img-wrapper">
              <img src="${hotel.thumbnail || hotel.mainImage || 'https://via.placeholder.com/400x250'}" alt="${hotel.name}" class="card-img">
              <div class="badge-stars">
                <i class="fa-solid fa-star"></i> ${hotel.starRating || 5}
              </div>
            </div>
            <div class="card-body">
              <h3 class="card-title">${hotel.name}</h3>
              <div class="card-footer-info">
                <div class="stars-rating">
                  ${renderStars(hotel.averageRating || hotel.rating || 0)}
                  <span class="review-count">(${hotel.reviewCount || 0})</span>
                </div>
                <div class="rooms-count">${hotel.roomCount || (hotel.rooms ? hotel.rooms.length : 0)} rooms</div>
              </div>
            </div>
          </a>
          <button class="btn-wishlist ${isSaved ? 'active' : ''}" onclick="toggleSaveHotel(${hotel.id}, this)">
            <i class="${isSaved ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
          </button>
        </div>
      `;
    }).join("");
  }

  function renderStars(rating) {
    let stars = "";
    const floor = Math.floor(rating);
    for (let i = 0; i < 5; i++) {
      stars += i < floor
        ? '<i class="fa-solid fa-star"></i>'
        : '<i class="fa-regular fa-star"></i>';
    }
    return stars;
  }

  function applyFilters() {
    let filtered = [...allHotels];
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const selCountry = countryFilter ? countryFilter.value : "";
    const selCity = cityFilter ? cityFilter.value : "";
    const selStars = starsFilter ? starsFilter.value : "";
    const selRating = ratingFilter ? ratingFilter.value : "";
    const selSort = sortBy ? sortBy.value : "";

    if (searchTerm) {
      filtered = filtered.filter(h =>
        (h.name && h.name.toLowerCase().includes(searchTerm)) ||
        (h.city && h.city.toLowerCase().includes(searchTerm))
      );
    }

    if (selCountry) {
      filtered = filtered.filter(h => (h.country || (h.address && h.address.country)) === selCountry);
    }

    if (selCity) {
      filtered = filtered.filter(h => (h.city || (h.address && h.address.city)) === selCity);
    }

    if (selStars) {
      filtered = filtered.filter(h => (h.starRating || 0) >= parseInt(selStars));
    }

    if (selRating) {
      filtered = filtered.filter(h => (h.averageRating || h.rating || 0) >= parseFloat(selRating));
    }

    if (selSort) {
      if (selSort === "name") {
        filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      } else if (selSort === "starRating") {
        filtered.sort((a, b) => (b.starRating || 0) - (a.starRating || 0));
      } else if (selSort === "averageRating") {
        filtered.sort((a, b) => (b.averageRating || b.rating || 0) - (a.averageRating || a.rating || 0));
      } else if (selSort === "reviewCount") {
        filtered.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
      }
    }

    updateActiveTags(selCountry, selCity, selStars, selRating, selSort);
    renderHotels(filtered);
  }

  function updateActiveTags(country, city, stars, rating, sort) {
    if (!tagsList || !filterCountBadge || !activeTagsRow) return;
    tagsList.innerHTML = "";
    let count = 0;

    if (country) {
      count++;
      tagsList.innerHTML += `<div class="filter-tag" onclick="clearFilterField('country')">Country: ${country} <i class="fa-solid fa-xmark"></i></div>`;
    }
    if (city) {
      count++;
      tagsList.innerHTML += `<div class="filter-tag" onclick="clearFilterField('city')">City: ${city} <i class="fa-solid fa-xmark"></i></div>`;
    }
    if (stars) {
      count++;
      tagsList.innerHTML += `<div class="filter-tag" onclick="clearFilterField('stars')">${stars}★ <i class="fa-solid fa-xmark"></i></div>`;
    }
    if (rating) {
      count++;
      tagsList.innerHTML += `<div class="filter-tag" onclick="clearFilterField('rating')">${rating}+ Rating <i class="fa-solid fa-xmark"></i></div>`;
    }
    if (sort) {
      count++;
      tagsList.innerHTML += `<div class="filter-tag" onclick="clearFilterField('sort')">Sort: ${sort} <i class="fa-solid fa-xmark"></i></div>`;
    }

    filterCountBadge.textContent = count;
    if (count > 0) {
      filterCountBadge.classList.remove("hidden");
      activeTagsRow.classList.remove("hidden");
    } else {
      filterCountBadge.classList.add("hidden");
      activeTagsRow.classList.add("hidden");
    }
  }

  window.clearFilterField = function(type) {
    if (type === "country" && countryFilter) countryFilter.value = "";
    if (type === "city" && cityFilter) cityFilter.value = "";
    if (type === "stars" && starsFilter) starsFilter.value = "";
    if (type === "rating" && ratingFilter) ratingFilter.value = "";
    if (type === "sort" && sortBy) sortBy.value = "";
    applyFilters();
  };
});

window.toggleSaveHotel = async function(hotelId, btn) {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("გთხოვთ გაიაროთ ავტორიზაცია სასტუმროს შესანახად!");
    window.location.href = "login.html";
    return;
  }

  const icon = btn.querySelector("i");
  const isSaved = savedHotelsMap.has(Number(hotelId));

  try {
    if (isSaved) {
      const saveId = savedHotelsMap.get(Number(hotelId));
      const res = await fetch(`https://bookingapi.stepacademy.ge/api/saves/${saveId}`, {
        method: "DELETE",
        headers: {
          "accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        savedHotelsMap.delete(Number(hotelId));
        icon.className = "fa-regular fa-heart";
        btn.classList.remove("active");
      }
    } else {
      const res = await fetch(`https://bookingapi.stepacademy.ge/api/saves/hotel/${hotelId}`, {
        method: "POST",
        headers: {
          "accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const json = await res.json();
        const saveId = json.data;
        savedHotelsMap.set(Number(hotelId), saveId);
        icon.className = "fa-solid fa-heart";
        btn.classList.add("active");
      }
    }
  } catch (err) {
    console.error(err);
  }
};

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