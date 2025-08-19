const defaultOptions = {duration: 4000, showClose: true, showProgress: true, position: 'top-right'};
let countdownInterval = null, remainingTime = 0;
const iconMap = {success: '✓', error: '✕', warning: '⚠', info: 'ℹ'};

function createToast(type, title, message, options) {
    const opts = $.extend({}, defaultOptions, options);
    const toastId = 'toast_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const toastHtml = `<div class="toast ${type}"id="${toastId}"><div class="toast-icon">${iconMap[type] || iconMap.info}</div><div class="toast-content">${title ? `<div class="toast-title">${title}</div>` : ''}<div class="toast-message">${message}</div></div>${opts.showClose ? '<button class="toast-close" onclick="closeToast(\'' + toastId + '\')">&times;</button>' : ''}${opts.showProgress ? `<div class="toast-progress"style="animation-duration: ${opts.duration}ms;"></div>` : ''}</div>`;
    return {id: toastId, html: toastHtml, duration: opts.duration}
}

function showToast(type, title, message, options) {
    const toast = createToast(type, title, message, options);
    const $container = $('#toastContainer');
    if ($container.length === 0) {
        $('body').append('<div class="toast-container" id="toastContainer"></div>')
    }
    $('#toastContainer').append(toast.html);
    const $toast = $('#' + toast.id);
    setTimeout(() => {
        $toast.addClass('show')
    }, 10);
    if (toast.duration > 0) {
        setTimeout(() => {
            closeToast(toast.id)
        }, toast.duration)
    }
    return toast.id
}

window.closeToast = function (toastId) {
    const $toast = $('#' + toastId);
    if ($toast.length) {
        $toast.removeClass('show');
        setTimeout(() => {
            $toast.remove()
        }, 300)
    }
};

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function startCountdown() {
    remainingTime = 15 * 60;
    const timerElement = document.getElementById('countdownTimer');
    if (countdownInterval) {
        clearInterval(countdownInterval)
    }
    timerElement.textContent = formatTime(remainingTime);
    timerElement.classList.remove('warning');
    countdownInterval = setInterval(() => {
        remainingTime--;
        if (remainingTime <= 0) {
            clearInterval(countdownInterval);
            timerElement.textContent = '00:00';
            showToast('error', '', '订单已超时，请重新下单');
            closePurchaseModal();
            return
        }
        timerElement.textContent = formatTime(remainingTime);
        if (remainingTime <= 60) {
            timerElement.classList.add('warning')
        }
    }, 1000)
}

function stopCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null
    }
}

function toggleMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    const menuBtn = document.querySelector('.mobile-menu-btn');
    navLinks.classList.toggle('active');
    menuBtn.classList.toggle('active')
}

$('.mobile-menu-btn').click(function () {
    toggleMobileMenu();
});

document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        const navLinks = document.getElementById('navLinks');
        const menuBtn = document.querySelector('.mobile-menu-btn');
        if (window.innerWidth <= 767) {
            navLinks.classList.remove('active');
            menuBtn.classList.remove('active')
        }
    })
});

$(function (){
    $('.category-item').click(function (){
        const tabindex = parseInt($(this).attr('tabindex'));
        $(this).addClass('active');
        $(this).siblings().removeClass('active');
        if (tabindex === 0) {
            $('.account-row').show();
        }else{
            $('.account-row').hide();
            $('.product-'+ tabindex).show();
        }
    });
})

function searchOrder(event) {
    event.preventDefault();
    const input = event.target.querySelector('.search-input');
    return showToast('error', '', '未找到订单')
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerHeight = document.querySelector('header').offsetHeight;
            const targetPosition = target.offsetTop - headerHeight - 20;
            window.scrollTo({top: targetPosition, behavior: 'smooth'});
            document.querySelectorAll('.nav-links a').forEach(link => {
                link.classList.remove('active')
            });
            this.classList.add('active')
        }
    })
});

$(window).on('resize', function() {
    if ($(window).width() > 767) {
        $('#navLinks').removeClass('active');
        $('.mobile-menu-btn').removeClass('active');
    }
});

window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const scrollY = window.pageYOffset;
    const headerHeight = document.querySelector('header').offsetHeight;
    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - headerHeight - 100;
        const sectionId = section.getAttribute('id');
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            document.querySelectorAll('.nav-links a').forEach(link => {
                link.classList.remove('active')
            });
            document.querySelector(`.nav-links a[href="#${sectionId}"]`)?.classList.add('active')
        }
    })
});
$('.subtract').click(function () {
    changeQuantity(-1)
});
$('.increase').click(function () {
    changeQuantity(1)
});
$('#quantity').change(function () {
    updateTotal()
});
$('#email').change(function () {
    validateForm()
});
$('.payment-method').click(function () {
    selectPayment($(this))
});
$('.close-modal-btn').click(function () {
    closePurchaseModal()
});

function changeQuantity(delta) {
    const input = $('#quantity');
    const newValue = parseInt(input.val()) + delta;
    if (newValue >= 1 && newValue <= 61) {
        input.val(newValue);
        updateTotal()
    }
}

function updateTotal() {
    const quantity = parseInt($('#quantity').val()) || 1;
    const unitPrice = 11.87;
    const total = quantity * unitPrice;
    $('#totalPrice').text(`$${total.toLocaleString()}`)
}

function selectPayment(element) {
    $('.payment-method').removeClass('selected');
    $(element).addClass('selected')
}

function validateForm() {
    const email = $('#email').val();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    return isValid
}

function showPurchaseModal() {
    const email = $('#email').val(),
        quantity = $('#quantity').val(),
        total = $('#totalPrice').text(),
        _payment = $('.payment-method.selected'),
        payment = _payment.find('.payment-text').html(),
        product_name = $('.detail-info > h1').html();

    $('#summaryEmail').text(email);
    $('#summaryQuantity').text(quantity);
    $('#summaryTotal').text(total);
    $('#summaryPayment').text(payment);
    $('.address-payment').text(payment);
    $('#product_name').text(product_name);

    const _addr = [
        [
            'USDT-TRC20',
            'TXrzgVmz7bKXxke3KgtEANvN2PagVQEHfA'
        ],
        [
            'USDT-ERC20',
            '0x5cA1D8Ee36B92ED120b7Dc689967A66E09f7579C'
        ],
        [
            'USDT-BEP20',
            '0x5cA1D8Ee36B92ED120b7Dc689967A66E09f7579C'
        ],
        [
            'USDT-Solana',
            'EXJ91HRdskmYgyPL9QJFtzow1DNGLaPnRSDSiYQDqav'
        ]
    ];
    const found = _addr.find(item => item[0] === payment);
    $('#usdtAddress').text(found[1]);
    $('.copy-btn').attr('data-clipboard-text', found[1]);
    $('#qr-code').empty();
    new QRCode("qr-code", {
        text: found[1],
        width: 180,
        height: 180,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
    const modal = $('#purchaseModal');
    modal.addClass('active');
    $('body').css('overflow', 'hidden');
    startCountdown();
}

function closePurchaseModal() {
    const modal = $('#purchaseModal');
    modal.removeClass('active');
    $('body').css('overflow', '')
}

if (typeof ClipboardJS !== 'undefined') {
    var clipboard = new ClipboardJS('.copy-btn');
    clipboard.on('success', function (e) {
        showToast('success', '', '复制成功');
        e.clearSelection()
    })
}

$('#buyBtn').click(function () {
    if (!validateForm()) {
        return showToast('error', '', '请填写正确的邮箱地址')
    }
    showToast('success', '', '创建订单成功');
    showPurchaseModal()
});

window.addEventListener('beforeunload', () => {
    stopCountdown()
});
$(document).ready(function () {
    $('#purchaseModal').on('click', function (e) {
        if (e.target === this) {
            closePurchaseModal()
        }
    });

    $(document).on('keydown', function (e) {
        if (e.key === 'Escape') {
            closePurchaseModal()
        }
    });
});