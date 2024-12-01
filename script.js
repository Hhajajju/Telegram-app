// Global variables for the balance and reward process
let userBalance = 0.000; // User's initial balance
let referralEarnings = 0.000; // Referral earnings
let claimAmounts = 0.005; // Reward for each claim
let dailyClaimTimeRemaining = 0; // Remaining time for daily claim
let referralList = []; // Placeholder for referral list

// Show the section when clicked
function showSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'block';
}

// Show the loading screen and navigate to the home section after loading
window.onload = function () {
    setTimeout(() => {
        document.getElementById("loading-screen").style.display = "none"; // Hide loading screen
        showSection('home-section'); // Show home section
    }, 2000); // Simulate loading for 2 seconds
};

// Function to update the balance displayed in the UI
function updateBalance() {
    document.getElementById("balance").textContent = userBalance.toFixed(3);
}

// API Call to handle all user actions (claiming rewards, referral earnings, etc.)
function handleUserActions() {
    const requestData = {
        balance: userBalance,
        referralEarnings: referralEarnings,
        dailyClaimTimeRemaining: dailyClaimTimeRemaining,
        referrals: referralList,
        claimAmounts: claimAmounts,
    };

    fetch('/api/handle_user_actions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
    })
    .then(response => response.json())
    .then(data => {
        // Update frontend with new balance, referral earnings, etc.
        userBalance = data.userBalance;
        referralEarnings = data.referralEarnings;
        dailyClaimTimeRemaining = data.dailyClaimTimeRemaining;
        referralList = data.referrals;

        updateBalance();
        updateReferralList(referralList);
        updateDailyClaimTimer();
    })
    .catch(error => {
        console.error('Error handling user actions:', error);
    });
}

// Function to update the referral list display
function updateReferralList(referrals) {
    const referralListElement = document.getElementById('referral-list');
    if (referrals.length > 0) {
        referralListElement.innerHTML = referrals.join('<br>');
    } else {
        referralListElement.innerHTML = 'No referrals yet.';
    }
}

// Daily claim reward functionality
function updateDailyClaimTimer() {
    const timerElement = document.getElementById('timer-daily-reward');
    
    if (dailyClaimTimeRemaining > 0) {
        dailyClaimTimeRemaining--;
        const hours = Math.floor(dailyClaimTimeRemaining / 3600);
        const minutes = Math.floor((dailyClaimTimeRemaining % 3600) / 60);
        const seconds = dailyClaimTimeRemaining % 60;
        timerElement.innerText = `Next claim in: ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } else {
        timerElement.innerText = "You can claim now!";
    }
}

// Handle withdrawal process
function handleWithdrawal(event) {
    event.preventDefault();
    const withdrawalAmount = parseFloat(document.getElementById('withdraw-amount').value);
    const withdrawalAddress = document.getElementById('withdraw-address').value;

    if (isNaN(withdrawalAmount) || withdrawalAmount < 3) {
        alert("Minimum withdrawal is $3.");
        return;
    }

    if (withdrawalAddress === "") {
        alert("Please enter a valid address.");
        return;
    }

    if (withdrawalAmount > userBalance) {
        alert("Insufficient balance.");
        return;
    }

    // Trigger API call to process withdrawal along with other actions
    fetch('/api/handle_user_actions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'withdraw',
            withdrawalAmount: withdrawalAmount,
            withdrawalAddress: withdrawalAddress,
            balance: userBalance,
        }),
    })
    .then(response => response.json())
    .then(data => {
        // Update the UI based on the server's response
        userBalance = data.userBalance;
        updateBalance();
        document.getElementById('withdraw-status').innerText = `Withdrawal of $${withdrawalAmount} to ${withdrawalAddress} is pending.`;
    })
    .catch(error => {
        console.error('Error handling withdrawal:', error);
    });
}

// Handle claim rewards (e.g., ad rewards, daily rewards)
function claimReward(adIndex) {
    const adButton = document.querySelectorAll('.claim-btn')[adIndex];

    if (adButton.dataset.claimInProgress !== 'true') return;

    // Add reward to user's balance
    userBalance += claimAmounts;
    updateBalance();

    // Update button and timer
    adButton.textContent = "Claimed";
    adButton.style.backgroundColor = "orange";
    adButton.disabled = true;

    // Trigger API call to process claim and cooldown
    handleUserActions();
}

// Referral earnings functionality
function claimReferralCommission() {
    if (referralEarnings > 0) {
        userBalance += referralEarnings;
        updateBalance();
        referralEarnings = 0;
        alert('Referral commission claimed successfully!');
    } else {
        alert('No referral commission available.');
    }
}

// Generate referral link
function generateReferralLink() {
    let referralLink = "https://t.me/yourbot?start=" + generateRandomReferralCode();
    document.getElementById('referral-link').innerText = referralLink;
    return referralLink;
}

// Generate a random referral code
function generateRandomReferralCode() {
    return Math.random().toString(36).substring(2, 10); // Random 8 character code
}

// Copy referral link to clipboard
function copyReferralLink() {
    let referralLink = document.getElementById('referral-link').innerText;
    navigator.clipboard.writeText(referralLink).then(() => {
        alert('Referral link copied to clipboard!');
    });
}

// Event listeners
document.querySelectorAll('.claim-btn').forEach((button, index) => {
    button.dataset.claimInProgress = 'false';
    button.onclick = function () {
        if (button.dataset.claimInProgress === 'false') {
            watchAds(index); // Start the ad-watching process when clicked
        }
    };
});

document.getElementById('claim-daily-reward').addEventListener('click', claimDailyReward);
document.getElementById('withdraw-form').addEventListener('submit', handleWithdrawal);
document.getElementById('claim-referral-commission').addEventListener('click', claimReferralCommission);

// Daily claim functionality
function claimDailyReward() {
    if (dailyClaimTimeRemaining > 0) return;

    userBalance += 0.003;
    updateBalance();

    dailyClaimTimeRemaining = 86400; // 24 hours in seconds
    setInterval(updateDailyClaimTimer, 1000);
    document.getElementById('claim-daily-reward').innerText = 'Claimed';
    document.getElementById('claim-daily-reward').disabled = true;
}

// Function to watch ads (for claiming rewards)
function watchAds(adIndex) {
    const adButton = document.querySelectorAll('.claim-btn')[adIndex];
    const timerElement = document.getElementById(`timer-${adIndex}`);
    
    if (adButton.dataset.claimInProgress === 'true') return; // Prevent starting if claim is in progress

    // Change button to show "Claim" after watching the ad
    adButton.textContent = "Claim";
    adButton.style.backgroundColor = "green"; // Change button color to green

    // Set the short cooldown timer before the claim button is active
    startClaimTimer(adIndex);

    // Mark this ad as "claim in progress"
    adButton.dataset.claimInProgress = 'true';

    // Start the ad-watching timer and allow claim
    adButton.onclick = function () {
        claimReward(adIndex);
    };
}

// Function to start the 2-hour cooldown timer after claiming
function startCooldownTimer(adIndex) {
    const adButton = document.querySelectorAll('.claim-btn')[adIndex];
    const timerElement = document.getElementById(`timer-${adIndex}`);
    let remainingTime = 2 * 60 * 60; // 2 hours in seconds

    function updateTimer() {
        const hours = Math.floor(remainingTime / 3600);
        const minutes = Math.floor((remainingTime % 3600) / 60);
        const seconds = remainingTime % 60;
        timerElement.textContent = `Next claim in: ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        remainingTime--;

        if (remainingTime < 0) {
            clearInterval(adButton.timer); // Stop the timer
            adButton.textContent = "Start"; // Reset button text to "Start"
            adButton.style.backgroundColor = "blue"; // Reset button color
            adButton.disabled = false; // Enable the button again
        }
    }

    adButton.timer = setInterval(updateTimer, 1000); // Update timer every second
}
