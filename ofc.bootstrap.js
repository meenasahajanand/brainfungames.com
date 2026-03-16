// ================================ Base Configuration ================================
const IPAPI_KEY = "RrtTUs6AdrbN4q0";
const API_URL =
  "https://pro.ip-api.com/json/?key=" +
  IPAPI_KEY +
  "&fields=status,countryCode,query,proxy,hosting";
const MAX_REQUESTS = 100;
const GA_MEASUREMENT_ID = "G-4QB8WL3MQ0";

// Country-specific floor CPM arrays
const COUNTRY_FLOORS = {
  tier1: [
    800, 700, 600, 500, 425, 375, 325, 275, 220, 190, 160, 140, 120, 100, 85,
    70, 60, 55, 44, 38, 32, 28, 24,
  ],
  tier2: [
    800, 650, 550, 450, 375, 325, 275, 220, 190, 160, 140, 120, 100, 85, 70, 60,
    50, 40, 35, 30, 25, 20, 17, 14, 12,
  ],
  tier3: [
    500, 400, 350, 300, 250, 200, 175, 150, 125, 100, 85, 70, 60, 50, 40, 35,
    30, 25, 20, 17, 14, 12, 10, 8, 6,
  ],
  tier4: [
    300, 250, 200, 175, 150, 125, 100, 85, 70, 60, 50, 40, 35, 30, 25, 20, 17,
    14, 12, 10, 8, 6, 5, 4, 3,
  ],
};

const COUNTRY_TIER_MAP = {
  US: "tier1", CA: "tier1", GB: "tier1", AU: "tier1", NZ: "tier1",
  IE: "tier1", CH: "tier1", AT: "tier1", DK: "tier1", FI: "tier1",
  DE: "tier2", FR: "tier2", IT: "tier2", ES: "tier2", NL: "tier2",
  SE: "tier2", NO: "tier2", BE: "tier2", PT: "tier2", GR: "tier2",
  BR: "tier3", MX: "tier3", AR: "tier3", CL: "tier3", CO: "tier3",
  PL: "tier3", TR: "tier3", RU: "tier3", ZA: "tier3", SA: "tier3",
  IN: "tier4", PK: "tier4", BD: "tier4", PH: "tier4", ID: "tier4",
  VN: "tier4", TH: "tier4", MY: "tier4", EG: "tier4", NG: "tier4",
};

// ================================ Page-Load Loader ================================

(function injectPageLoader() {
  const loaderStyle = document.createElement("style");
  loaderStyle.id = "survey-loader-styles";
  loaderStyle.textContent = `
    #survey-page-loader {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      z-index: 9999999;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.35s ease;
    }
    #survey-page-loader.loader-fade-out {
      opacity: 0;
      pointer-events: none;
    }
    .survey-page-loader-spinner {
      width: 56px; height: 56px;
      border: 6px solid rgba(255,255,255,0.2);
      border-top: 6px solid #ffffff;
      border-radius: 50%;
      animation: spin 0.9s linear infinite;
    }
    @keyframes spin {
      0%   { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  const appendStyle = () => {
    if (!document.getElementById("survey-loader-styles")) {
      (document.head || document.documentElement).appendChild(loaderStyle);
    }
  };

  const createLoader = () => {
    if (document.getElementById("survey-page-loader")) return;
    const loader = document.createElement("div");
    loader.id = "survey-page-loader";
    loader.innerHTML = `<div class="survey-page-loader-spinner"></div>`;
    (document.body || document.documentElement).appendChild(loader);
  };

  appendStyle();

  if (document.body) {
    createLoader();
  } else {
    document.addEventListener("DOMContentLoaded", createLoader, { once: true });
  }
})();

/**
 * Smoothly removes the page-load loader.
 */
function removePageLoader() {
  const loader = document.getElementById("survey-page-loader");
  if (!loader) return;
  loader.classList.add("loader-fade-out");
  setTimeout(() => {
    if (loader.parentNode) loader.parentNode.removeChild(loader);
  }, 380);
}

// ================================ Google Ads Conversion Tracking ================================

function gtag_report_conversion(url) {
  var callback = function () {
    if (typeof url != "undefined") {
      window.location = url;
    }
  };
  gtag("event", "conversion", {
    send_to: "AW-17830746871/eE9KCKu7i9cbEPe1rrZC",
    value: 0.1,
    currency: "AED",
    event_callback: callback,
  });
  return false;
}

// ================================ Utility Functions ================================

function getOrCreateUserId() {
  let userId = localStorage.getItem("ad_user_id");
  if (!userId) {
    userId = "usr_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("ad_user_id", userId);
  }
  return userId;
}

function getUserProfile() {
  const profile = localStorage.getItem("ad_user_profile");
  return profile
    ? JSON.parse(profile)
    : {
        interests: [],
        categories: [],
        adInteractions: 0,
        lastAdClick: null,
        preferredAdTypes: [],
      };
}

function updateUserProfile(data) {
  const profile = getUserProfile();
  Object.assign(profile, data);
  localStorage.setItem("ad_user_profile", JSON.stringify(profile));
}

function trackAdEvent(eventName, params) {
  if (typeof gtag !== "undefined") {
    gtag("event", eventName, {
      ...params,
      user_id: getOrCreateUserId(),
      timestamp: new Date().toISOString(),
    });
  }
  console.log(`📊 GA Event: ${eventName}`, params);
}

async function getCountryCode() {
  let countryCode = sessionStorage.getItem("avCountry");

  if (!countryCode) {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();

      if (data.status === "success") {
        countryCode = data.countryCode;
        sessionStorage.setItem("avCountry", countryCode);
        sessionStorage.setItem("userIP", data.query);

        trackAdEvent("country_detected", {
          country: countryCode,
          is_proxy: data.proxy || false,
          is_hosting: data.hosting || false,
        });
      }
    } catch (error) {
      console.error("Error fetching country:", error);
      countryCode = "US";
    }
  }

  return countryCode;
}

function getFloorArrayForCountry(countryCode) {
  const tier = COUNTRY_TIER_MAP[countryCode] || "tier4";
  return COUNTRY_FLOORS[tier];
}

function getRequestTracking() {
  const data = localStorage.getItem("ad_request_tracking");
  return data
    ? JSON.parse(data)
    : {
        totalRequests: 0,
        currentCycle: 0,
        lastReset: Date.now(),
        successfulRequests: 0,
        failedRequests: 0,
      };
}

function updateRequestTracking(success = false) {
  const tracking = getRequestTracking();
  tracking.totalRequests++;

  if (success) {
    tracking.successfulRequests++;
  } else {
    tracking.failedRequests++;
  }

  if (tracking.totalRequests >= MAX_REQUESTS) {
    tracking.totalRequests = 0;
    tracking.currentCycle++;
    tracking.lastReset = Date.now();

    console.log(`🔄 Request limit reached. Starting cycle ${tracking.currentCycle + 1}`);
    trackAdEvent("request_cycle_reset", {
      cycle: tracking.currentCycle,
      success_rate: ((tracking.successfulRequests / MAX_REQUESTS) * 100).toFixed(2),
    });

    tracking.successfulRequests = 0;
    tracking.failedRequests = 0;
  }

  localStorage.setItem("ad_request_tracking", JSON.stringify(tracking));
  return tracking;
}

function getCurrentFloorIndex(floorArray) {
  const tracking = getRequestTracking();
  const baseIndex = tracking.totalRequests % floorArray.length;
  const cycleAdjustment = Math.min(tracking.currentCycle, floorArray.length - 1);
  const adjustedIndex = Math.min(baseIndex + cycleAdjustment, floorArray.length - 1);
  return adjustedIndex;
}

// ================================ Display Ads (3 slots) ================================

(async function initDisplayAds() {
  window.googletag = window.googletag || { cmd: [] };

  const userId = getOrCreateUserId();
  const countryCode = await getCountryCode();
  const floorArray = getFloorArrayForCountry(countryCode);
  const tracking = getRequestTracking();

  const adSlots = [
    { adUnit: "/23330730517/brainfungames.com_d1", divId: "myw_top_1" },
    { adUnit: "/23330730517/brainfungames.com_d2", divId: "myw_top_2" },
    { adUnit: "/23330730517/brainfungames.com_d3", divId: "myw_top_3" },
  ];

  googletag.cmd.push(function () {
    const userProfile = getUserProfile();
    const floorIndex = getCurrentFloorIndex(floorArray);
    const currentFloor = floorArray[floorIndex];

    adSlots.forEach(({ adUnit, divId }) => {
      let slotFloorIndex = floorIndex;
      let slotCurrentFloor = currentFloor;
      let attemptCount = 1;

      const slot = googletag
        .defineSlot(adUnit, [[300, 250], [336, 280], "fluid"], divId)
        .setTargeting("price_rule", slotCurrentFloor.toFixed(2))
        .setTargeting("user_id", userId)
        .setTargeting("country", countryCode)
        .setTargeting("user_interests", userProfile.interests.slice(0, 5).join(",") || "general")
        .setTargeting("ad_interactions", userProfile.adInteractions.toString())
        .setTargeting("request_cycle", tracking.currentCycle.toString())
        .addService(googletag.pubads());

      googletag.pubads().addEventListener("slotRenderEnded", function (event) {
        if (event.slot.getSlotElementId() === divId) {
          const success = !event.isEmpty;

          console.log(
            `${success ? "✅" : "❌"} Display ad [${divId}] render (Attempt ${attemptCount}) | Floor: $${slotCurrentFloor} | Country: ${countryCode}`
          );

          trackAdEvent("display_ad_rendered", {
            ad_unit: adUnit,
            div_id: divId,
            price_rule: slotCurrentFloor,
            country: countryCode,
            is_empty: event.isEmpty,
            creative_id: event.creativeId,
            line_item_id: event.lineItemId,
            attempt: attemptCount,
          });

          if (success) {
            updateRequestTracking(true);
          } else {
            // Waterfall: try next floor
            slotFloorIndex++;
            if (slotFloorIndex < floorArray.length) {
              slotCurrentFloor = floorArray[slotFloorIndex];
              attemptCount++;
              console.log(`🔄 Retrying [${divId}] with floor: $${slotCurrentFloor}`);
              slot.setTargeting("price_rule", slotCurrentFloor.toFixed(2));
              googletag.pubads().refresh([slot]);
            } else {
              console.log(`❌ All floors failed for [${divId}]`);
              updateRequestTracking(false);
            }
          }
        }
      });

      googletag.pubads().addEventListener("slotOnload", function (event) {
        if (event.slot.getSlotElementId() === divId) {
          trackAdEvent("display_ad_loaded", {
            ad_unit: adUnit,
            price_rule: slotCurrentFloor,
            country: countryCode,
          });
        }
      });

      googletag.pubads().addEventListener("impressionViewable", function (event) {
        if (event.slot.getSlotElementId() === divId) {
          trackAdEvent("display_ad_viewable", {
            ad_unit: adUnit,
            price_rule: slotCurrentFloor,
            country: countryCode,
          });
        }
      });

      console.log(
        `📢 Display ad [${divId}] initialized | Floor: $${slotCurrentFloor} | Country: ${countryCode}`
      );

      googletag.display(divId);
    });

    googletag.pubads().enableSingleRequest();
    googletag.pubads().setPrivacySettings({ restrictDataProcessing: false });
    googletag.enableServices();
  });
})();

// ================================ Google Analytics Setup ================================

if (typeof gtag === "undefined") {
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID, {
    user_id: getOrCreateUserId(),
    custom_map: {
      dimension1: "country",
      dimension2: "price_rule",
      dimension3: "user_segment",
    },
  });

  gtag("config", "AW-17830746871");

  const gaScript = document.createElement("script");
  gaScript.async = true;
  gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(gaScript);
}

// ================================ User Behavior Tracking ================================

document.addEventListener("DOMContentLoaded", function () {
  const contentElements = document.querySelectorAll("[data-category]");
  contentElements.forEach((element) => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const category = entry.target.getAttribute("data-category");
            const profile = getUserProfile();

            if (!profile.categories.includes(category)) {
              profile.categories.push(category);
              updateUserProfile(profile);

              trackAdEvent("content_viewed", {
                category: category,
                user_id: getOrCreateUserId(),
              });
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(element);
  });

  let pageLoadTime = Date.now();
  window.addEventListener("beforeunload", function () {
    const timeSpent = Math.round((Date.now() - pageLoadTime) / 1000);
    trackAdEvent("session_end", {
      time_spent_seconds: timeSpent,
      total_requests: getRequestTracking().totalRequests,
    });
  });
});

// ================================ Rewarded Ad with Loader ================================

async function RewardAdAdvanced() {
  // Show loader while we attempt the rewarded ad
  const loader = document.getElementById("survey-page-loader");
  if (!loader) {
    // Re-create loader if it was already removed
    const loaderEl = document.createElement("div");
    loaderEl.id = "survey-page-loader";
    loaderEl.innerHTML = `<div class="survey-page-loader-spinner"></div>`;
    document.body.appendChild(loaderEl);
  } else {
    // Make sure it's visible
    loader.classList.remove("loader-fade-out");
    loader.style.display = "flex";
  }

  executeRewardedAd();
}

async function executeRewardedAd() {
  const userId = getOrCreateUserId();
  const countryCode = await getCountryCode();
  const floorArray = getFloorArrayForCountry(countryCode);
  const tracking = getRequestTracking();

  console.log(
    `🌍 Country: ${countryCode} | User: ${userId} | Request: ${tracking.totalRequests + 1}/${MAX_REQUESTS} | Cycle: ${tracking.currentCycle + 1}`
  );

  let currentIndex = 0;
  let currentSlot = null;
  let isTesting = true;

  function tryFloor(index) {
    if (index >= floorArray.length) {
      console.log("❌ All floors failed — removing loader");
      removePageLoader();
      trackAdEvent("rewarded_ad_all_floors_failed", { country: countryCode });
      return;
    }

    const floorValue = floorArray[index];
    console.log(
      `🔍 Testing floor $${floorValue} (${index + 1}/${floorArray.length}) | Country: ${countryCode}`
    );

    googletag.cmd.push(function () {
      try {
        if (!googletag.enums.OutOfPageFormat?.REWARDED) {
          console.error("Rewarded ads not supported");
          removePageLoader();
          return;
        }

        currentSlot = googletag
          .defineOutOfPageSlot(
            "/23330730517/brainfungames.com_reward",
            googletag.enums.OutOfPageFormat.REWARDED
          )
          .addService(googletag.pubads())
          .setTargeting("price_rule", floorValue.toFixed(2))
          .setTargeting("user_id", userId)
          .setTargeting("country", countryCode)
          .setTargeting("user_segment", getUserProfile().interests.join(",") || "general");

        if (!currentSlot) {
          console.error("Failed to create rewarded slot");
          removePageLoader();
          return;
        }

        googletag.pubads().addEventListener("rewardedSlotReady", function (e) {
          console.log(`✅ WINNER: Rewarded ad filled at $${floorValue} | Country: ${countryCode}`);
          isTesting = false;

          updateRequestTracking(true);
          trackAdEvent("rewarded_ad_success", {
            price_rule: floorValue,
            country: countryCode,
            attempt_number: index + 1,
            request_count: tracking.totalRequests + 1,
          });

          // Remove loader just before showing the ad
          removePageLoader();
          e.makeRewardedVisible();
        });

        googletag.pubads().addEventListener("rewardedSlotClosed", function () {
          console.log(`❌ Ad closed at floor $${floorValue}`);
          googletag.destroySlots([currentSlot]);
          trackAdEvent("rewarded_ad_closed", {
            price_rule: floorValue,
            country: countryCode,
          });
        });

        googletag.pubads().addEventListener("rewardedSlotGranted", function (e) {
          console.log(`🎁 Reward granted for ad at $${floorValue}`);
          updateUserProfile({
            adInteractions: getUserProfile().adInteractions + 1,
            lastAdClick: Date.now(),
          });
          trackAdEvent("rewarded_ad_granted", {
            price_rule: floorValue,
            country: countryCode,
            reward: e.payload,
          });
        });

        // Timeout: floor didn't fill → try next
        setTimeout(() => {
          if (isTesting && currentSlot) {
            console.log(`⏰ Floor $${floorValue} timed out, trying next...`);
            googletag.destroySlots([currentSlot]);
            trackAdEvent("rewarded_ad_timeout", {
              price_rule: floorValue,
              country: countryCode,
              attempt_number: index + 1,
            });
            currentIndex++;
            tryFloor(currentIndex);
          }
        }, 5000);

        googletag.display(currentSlot);
        console.log(`📢 Request sent: $${floorValue} | User: ${userId}`);
      } catch (err) {
        console.error("Rewarded ad error:", err);
        currentIndex++;
        tryFloor(currentIndex);
      }
    });
  }

  tryFloor(0);
}

setTimeout(RewardAdAdvanced, 500);

// ================================ Public API ================================

window.showRewardedAd = function () {
  RewardAdAdvanced();
};

// ================================ Debug Helper ================================

window.adFloorDebug = {
  getUserId: getOrCreateUserId,
  getUserProfile: getUserProfile,
  getTracking: getRequestTracking,
  resetTracking: function () {
    localStorage.removeItem("ad_request_tracking");
    console.log("✅ Tracking reset");
  },
  resetUser: function () {
    localStorage.removeItem("ad_user_id");
    localStorage.removeItem("ad_user_profile");
    console.log("✅ User data reset");
  },
  getCountry: function () {
    return sessionStorage.getItem("avCountry");
  },
  removeLoader: function () {
    removePageLoader();
    console.log("✅ Page loader manually removed");
  },
  showStats: function () {
    const tracking = getRequestTracking();
    const profile = getUserProfile();
    console.table({
      "User ID": getOrCreateUserId(),
      Country: sessionStorage.getItem("avCountry"),
      "Total Requests": tracking.totalRequests,
      "Current Cycle": tracking.currentCycle + 1,
      "Success Rate":
        tracking.totalRequests > 0
          ? ((tracking.successfulRequests / tracking.totalRequests) * 100).toFixed(2) + "%"
          : "N/A",
      "Ad Interactions": profile.adInteractions,
      Interests: profile.interests.join(", ") || "None",
    });
  },
};
