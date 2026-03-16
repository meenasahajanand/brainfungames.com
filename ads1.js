(function () {
  window.googletag = window.googletag || { cmd: [] };

  const adSlots = [
    { adUnit: "/23330730517/brainfungames.com_d1", divId: "myw_top_1", size: [[300, 250], [336, 280], "fluid"] },
    { adUnit: "/23330730517/brainfungames.com_d2", divId: "myw_top_2", size: [[300, 250], [336, 280], "fluid"] },
    { adUnit: "/23330730517/brainfungames.com_d3", divId: "myw_top_3", size: [[300, 250], [336, 280], "fluid"] },
  ];

  let rewardedSlot = null;

  // --- Loader CSS ---
  const style = document.createElement("style");
  style.textContent = `
    #ad-loader-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      flex-direction: column;
      gap: 16px;
    }
    #ad-loader-overlay .spinner {
      width: 52px;
      height: 52px;
      border: 5px solid rgba(255,255,255,0.2);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    #ad-loader-overlay .loader-text {
      color: #ffffff;
      font-size: 15px;
      font-family: sans-serif;
      opacity: 0.85;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

  function showLoader() {
    const overlay = document.createElement("div");
    overlay.id = "ad-loader-overlay";
    overlay.innerHTML = `
      <div class="spinner"></div>
      <div class="loader-text">Loading Ad...</div>
    `;
    document.body.appendChild(overlay);
  }

  function hideLoader() {
    const overlay = document.getElementById("ad-loader-overlay");
    if (overlay) overlay.remove();
  }

  // --- Main GPT setup ---
  googletag.cmd.push(function () {

    // Regular display ads
    adSlots.forEach(function ({ adUnit, divId, size }) {
      googletag.defineSlot(adUnit, size, divId).addService(googletag.pubads());
    });

    // Rewarded ad slot — no .then(), just store the slot directly
    rewardedSlot = googletag.defineOutOfPageSlot(
      "/23330730517/brainfungames.com_reward",
      googletag.enums.OutOfPageFormat.REWARDED
    );

    if (rewardedSlot) {
      rewardedSlot.addService(googletag.pubads());
    }

    // Reward events
    googletag.pubads().addEventListener("rewardedSlotReady", function (event) {
      // Ad is ready — make it visible
      event.makeRewardedVisible();
    });

    googletag.pubads().addEventListener("rewardedSlotGranted", function (event) {
      console.log("Reward granted:", event.payload);
      // 👉 Your reward logic here
    });

    googletag.pubads().addEventListener("rewardedSlotClosed", function () {
      console.log("Reward ad closed.");
      // 👉 Optional close handling
    });

    googletag.pubads().enableSingleRequest();
    googletag.pubads().collapseEmptyDivs(true);
    googletag.enableServices();

    // Display regular ads
    adSlots.forEach(function ({ divId }) {
      googletag.display(divId);
    });

    // Show loader first, then display rewarded ad after 1s
    showLoader();
    setTimeout(function () {
      hideLoader();
      if (rewardedSlot) {
        googletag.display(rewardedSlot);
      }
    }, 1000);

  });
})();