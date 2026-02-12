        // Mobile Navigation Toggle
        const mobileToggle = document.querySelector(".mobile-toggle");
        const nav = document.querySelector("nav");

        mobileToggle.addEventListener("click", () => {
            nav.classList.toggle("active");
            mobileToggle.querySelector("i").classList.toggle("fa-bars");
            mobileToggle.querySelector("i").classList.toggle("fa-times");
        });

        // Close mobile menu when clicking on a link
        document.querySelectorAll("nav a").forEach((link) => {
            link.addEventListener("click", () => {
                nav.classList.remove("active");
                mobileToggle.querySelector("i").classList.add("fa-bars");
                mobileToggle.querySelector("i").classList.remove("fa-times");
            });
        });

        // Smooth Scrolling
        document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
            anchor.addEventListener("click", function (e) {
                e.preventDefault();

                const target = document.querySelector(this.getAttribute("href"));
                if (target) {
                    window.scrollTo({
                        top: target.offsetTop - 80,
                        behavior: "smooth",
                    });
                }
            });
        });

        // Dark/Light Mode Toggle
        const darkModeToggle = document.getElementById("darkModeToggle");
        const body = document.body;
        function updateToggleButton() {
            const icon = darkModeToggle.querySelector("i");
            if(document.body.classList.contains("dark-mode")) {
                icon.classList.remove("fa-moon");
                icon.classList.add("fa-sun");
                icon.style.color = "#ffffff";
            } else {
                icon.classList.remove("fa-sun");
                icon.classList.add("fa-moon");
                icon.style.color = "#000000";
            }
        }

        function applyDarkMode(isDark) {
            if(isDark) {
                body.classList.add("dark-mode");
            } else {
                body.classList.remove("dark-mode");
            }
            updateToggleButton();
        }

        //Check saved preference in localStorage
        const savedTheme = localStorage.getItem("theme");
        if(savedTheme) {
            applyDarkMode(savedTheme==="dark");
        } else {
            const prefersDark = window.matchMedia ("(prefers-color-schema: dark)").matches;
            applyDarkMode(prefersDark);
        }

        //Toggle dark mode on buttton click 
        darkModeToggle.addEventListener("click" , () => {
            const isDark = !body.classList.contains("dark-mode");
            applyDarkMode(isDark);
            localStorage.setItem("theme", isDark ? "dark" : "light");
        });

        // Header scroll effect
        window.addEventListener("scroll", () => {
            const header = document.querySelector("header");
            if (window.scrollY > 100) {
                header.style.boxShadow = "0 5px 20px rgba(0, 0, 0, 0.1)";
                header.style.background = "rgba(255, 255, 255, 0.95)";
            } else {
                header.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.1)";
                header.style.background = "var(--white)";
            }
        });

        // Modal functionality
        const modal = document.getElementById("pdfModal");
        const closeModal = document.getElementById("closeModal");
        const previewButtons = document.querySelectorAll(".btn-preview");

        // Open modal when preview button is clicked
        previewButtons.forEach((button) => {
            button.addEventListener("click", () => {
                modal.style.display = "flex";
                document.body.style.overflow = "hidden";
            });
        });

        // Close modal
        closeModal.addEventListener("click", () => {
            modal.style.display = "none";
            document.body.style.overflow = "auto";
        });

        // Close modal when clicking outside content
        window.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.style.display = "none";
                document.body.style.overflow = "auto";
            }
        }); 