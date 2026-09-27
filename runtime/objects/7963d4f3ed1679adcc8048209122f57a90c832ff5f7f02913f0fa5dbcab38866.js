function markLiveUpdate() {
  document.documentElement.dataset.runtimeProof = '1';
  const title = document.getElementById('content-title');
  if (title) title.textContent = 'Live update works';
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', markLiveUpdate, { once: true });
} else markLiveUpdate();
