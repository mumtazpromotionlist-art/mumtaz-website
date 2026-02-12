 // Emailjs form submission

(function () {
            emailjs.init("DyNriJ4IntVnfBE4S");
        })();

        document.addEventListener("DOMContentLoaded" , function() {
            const form = document.getElementById("contactForm");

            if(!form) {
                console.error("contactForm not found");
                return;
            }
        
        form.addEventListener("submit", function (e){
            e.preventDefault();

            emailjs.sendForm(
                "service_04odmca",
                "template_2xuq4t9",
                form
            ).then(
                function () {
                    alert("Message sent Successfully!");
                    document.getElementById("contactForm").reset();
                },
                function(error) {
                    alert("Failed to send message");
                    console.error("EmailJS Error:", error);
                }
            );
        });

    });