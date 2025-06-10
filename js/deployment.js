const deploymentTime = new Date('2025-06-09T21:59:00Z'); 

function updateUptime() {
  const now = new Date();
  const timeDiff = now - deploymentTime;
  const absoluteTimeDiff = Math.abs(timeDiff);
  
  const days = Math.floor(absoluteTimeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((absoluteTimeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((absoluteTimeDiff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((absoluteTimeDiff % (1000 * 60)) / 1000);
  
  const uptimeElement = document.getElementById('uptime');
  if (uptimeElement) {
    uptimeElement.innerHTML = `
      <span class="uptime-label">last deployment :</span>
      <span class="uptime-time">${days}d ${hours}h ${minutes}m ${seconds}s</span>
    `;
  }
}

updateUptime();
setInterval(updateUptime, 1000);