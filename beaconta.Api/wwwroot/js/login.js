$(function () {
    // تبديل عرض كلمة المرور
    $("#togglePassword").on("click", function () {
        const passField = $("#password");
        const type = passField.attr("type") === "password" ? "text" : "password";
        passField.attr("type", type);
        $(this).find("i").toggleClass("bi-eye bi-eye-slash");
    });

    // فورم تسجيل الدخول
    $("#loginForm").on("submit", function (e) {
        e.preventDefault();

        if (!this.checkValidity()) {
            this.classList.add("was-validated");
            return;
        }

        const data = {
            username: $("#username").val(),
            password: $("#password").val()
        };

        // 🔹 استخدام apiPost من api.js (Promise style)
        apiPost(API.base + "/Auth/login", data)
            .done(function (res) {
                const token = res.token || res;
                localStorage.setItem("jwtToken", token);

                $("#loginMessage")
                    .removeClass("d-none alert-danger")
                    .addClass("alert alert-success")
                    .text("تم تسجيل الدخول بنجاح، جاري التوجيه...");

                setTimeout(() => {
                    window.location.href = "/index.html";
                }, 1000);
            })
            .fail(function (xhr) {
                $("#loginMessage")
                    .removeClass("d-none alert-success")
                    .addClass("alert alert-danger")
                    .text("فشل تسجيل الدخول: " + (xhr.responseText || "بيانات غير صحيحة"));
            });
    });
});
