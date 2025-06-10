        let completedChallenges = 0;
        const totalChallenges = 5;
        let binaryState = [0, 0, 0, 0, 0, 0, 0, 0];

        function createParticles() {
            const particlesContainer = document.getElementById('particles');
            for (let i = 0; i < 50; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.top = Math.random() * 100 + '%';
                particle.style.animationDelay = Math.random() * 6 + 's';
                particlesContainer.appendChild(particle);
            }
        }

        console.log('%c🔒 RESTRICTED AREA 🔒', 'color: #ef4444; font-size: 18px; font-weight: bold; background: #1a1a1a; padding: 10px;');
        console.log('%cAccess Level: CONFIDENTIAL', 'color: #f59e0b; font-size: 14px;');
        console.log('%cExecute: unlockSecret() to proceed', 'color: #8b5cf6; font-size: 12px;');

        window.unlockSecret = function() {
            console.log('%c🎯 SECRET FUNCTION EXECUTED', 'color: #10b981; font-size: 16px; font-weight: bold;');
            console.log('%cSecret Code Discovered: "NIGHTFALL"', 'color: #8b5cf6; font-size: 14px; font-weight: bold;');
            console.log('%cEnter this code in the Developer\'s Secret challenge!', 'color: #a855f7; font-size: 12px;');
        };

        function checkCipher() {
            const input = document.getElementById('cipherInput').value.toLowerCase().trim();
            if (input === 'hello world' || input === 'hello world!') {
                showAchievement('cipherAchievement');
                updateProgress();
            } else {
                showError('cipherInput', 'Not quite right. Remember the shift value!');
            }
        }

        function toggleBinary(index) {
            binaryState[index] = binaryState[index] === 0 ? 1 : 0;
            const digit = document.getElementById('binaryGrid').children[index];
            digit.textContent = binaryState[index];
            digit.classList.toggle('active', binaryState[index] === 1);
        }

        function checkBinary() {
            const targetBinary = [0, 1, 0, 0, 0, 0, 0, 1]; 
            if (JSON.stringify(binaryState) === JSON.stringify(targetBinary)) {
                showAchievement('binaryAchievement');
                updateProgress();
            } else {
                showError('binaryGrid', 'Incorrect binary sequence. Think ASCII value of A = 65');
            }
        }

        function checkMorse() {
            const input = document.getElementById('morseInput').value.toLowerCase().trim();
            if (input === 'help me' || input === 'helpme') {
                showAchievement('morseAchievement');
                updateProgress();
            } else {
                showError('morseInput', 'Translation incorrect. Check your morse code chart!');
            }
        }

        function checkFibonacci() {
            const input = parseInt(document.getElementById('fibInput').value);
            if (input === 21) {
                showAchievement('fibAchievement');
                updateProgress();
            } else {
                showError('fibInput', 'Wrong number. Remember: each number is sum of previous two!');
            }
        }

        function checkConsole() {
            const input = document.getElementById('consoleInput').value.toLowerCase().trim();
            if (input === 'nightfall') {
                showAchievement('consoleAchievement');
                updateProgress();
            } else {
                showError('consoleInput', 'Check the console for the secret code!');
            }
        }

        function showAchievement(id) {
            const achievement = document.getElementById(id);
            achievement.style.display = 'block';
            completedChallenges++;
        }

        function updateProgress() {
            const progress = (completedChallenges / totalChallenges) * 100;
            document.getElementById('progressFill').style.width = progress + '%';
            
            if (completedChallenges === totalChallenges) {
                setTimeout(() => {
                    document.getElementById('finalModal').style.display = 'block';
                }, 1000);
            }
        }

        function showError(inputId, message) {
            const input = document.getElementById(inputId);
            input.style.borderColor = '#ef4444';
            input.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.3)';
            
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = 'color: #ef4444; font-size: 0.9rem; margin-top: 0.5rem; animation: fadeIn 0.3s ease;';
            errorDiv.textContent = message;
            
            const existingError = input.parentNode.querySelector('.error-message');
            if (existingError) existingError.remove();
            
            errorDiv.className = 'error-message';
            input.parentNode.appendChild(errorDiv);
            
            setTimeout(() => {
                input.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                input.style.boxShadow = 'none';
                errorDiv.remove();
            }, 3000);
        }

        function toggleHint(id) {
            const hint = document.getElementById(id);
            hint.style.display = hint.style.display === 'none' || !hint.style.display ? 'block' : 'none';
        }

        function closeFinalModal() {
            document.getElementById('finalModal').style.display = 'none';
        }

        createParticles();

        document.getElementById('finalModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeFinalModal();
            }
        });
