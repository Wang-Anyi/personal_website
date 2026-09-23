(function(){
  'use strict';

  var STORAGE_KEY = 'linshen_user';

  var overlay      = document.getElementById('loginOverlay');
  var modalClose   = document.getElementById('modalClose');
  var loginForm    = document.getElementById('loginForm');
  var loginUser    = document.getElementById('loginUser');
  var loginPass    = document.getElementById('loginPass');
  var loginError   = document.getElementById('loginError');
  var loginSubmit  = document.getElementById('loginSubmit');
  var togglePass   = document.getElementById('togglePass');
  var rememberMe   = document.getElementById('rememberMe');
  var navUser      = document.getElementById('navUser');

  var currentUser = null;

  /* ---------- 工具 ---------- */
  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  /* ---------- 打开 / 关闭弹窗 ---------- */
  function openLogin(){
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    loginError.textContent = '';
    setTimeout(function(){ try { loginUser.focus(); } catch(e){} }, 260);
  }

  function closeLogin(){
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    loginError.textContent = '';
  }

  /* ---------- 用户持久化 ---------- */
  function saveUser(u){
    try {
      if (rememberMe.checked){
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
        sessionStorage.removeItem(STORAGE_KEY);
      } else {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(u));
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch(e){}
  }

  function loadUser(){
    try {
      var raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch(e){ return null; }
  }

  function clearUser(){
    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
    } catch(e){}
  }

  /* ---------- 渲染导航用户区 ---------- */
  function renderUser(){
    if (currentUser){
      var initial = (currentUser.name || 'U').charAt(0).toUpperCase();
      navUser.innerHTML =
        '<button class="user-chip" id="userChip" type="button" aria-haspopup="true" aria-expanded="false">' +
          '<span class="user-avatar">' + escapeHtml(initial) + '</span>' +
          '<span class="user-name">' + escapeHtml(currentUser.name) + '</span>' +
        '</button>' +
        '<div class="user-menu glass" id="userMenu" hidden>' +
          '<div class="user-menu-head">' +
            '<span class="user-avatar lg">' + escapeHtml(initial) + '</span>' +
            '<div>' +
              '<strong>' + escapeHtml(currentUser.name) + '</strong>' +
              '<span>' + escapeHtml(currentUser.email) + '</span>' +
            '</div>' +
          '</div>' +
          '<button class="user-menu-item" id="logoutBtn" type="button">退出登录</button>' +
        '</div>';

      bindUserChip();

    } else {
      navUser.innerHTML =
        '<button class="login-btn" id="loginBtn" type="button">登录</button>';

      document.getElementById('loginBtn').addEventListener('click', openLogin);
    }
  }

  function bindUserChip(){
    var chip = document.getElementById('userChip');
    var menu = document.getElementById('userMenu');

    chip.addEventListener('click', function(e){
      e.stopPropagation();
      var isOpen = !menu.hasAttribute('hidden');
      if (isOpen){
        menu.setAttribute('hidden','');
        chip.setAttribute('aria-expanded','false');
      } else {
        menu.removeAttribute('hidden');
        chip.setAttribute('aria-expanded','true');
      }
    });

    document.getElementById('logoutBtn').addEventListener('click', function(){
      currentUser = null;
      clearUser();
      renderUser();
    });
  }

  /* ---------- 提交登录 ---------- */
  loginForm.addEventListener('submit', function(e){
    e.preventDefault();

    var user = loginUser.value.trim();
    var pass = loginPass.value;

    loginError.textContent = '';

    if (!user){
      loginError.textContent = '请输入邮箱或用户名';
      loginUser.focus();
      return;
    }
    if (!pass){
      loginError.textContent = '请输入密码';
      loginPass.focus();
      return;
    }
    if (pass.length < 4){
      loginError.textContent = '密码至少需要 4 位';
      loginPass.focus();
      return;
    }

    /* 模拟登录请求 */
    loginSubmit.disabled = true;
    loginSubmit.textContent = '登录中…';

    setTimeout(function(){
      var name = user.indexOf('@') > -1 ? user.split('@')[0] : user;
      var email = user.indexOf('@') > -1 ? user : user + '@linshen.dev';

      currentUser = { name: name, email: email };
      saveUser(currentUser);
      renderUser();

      loginSubmit.disabled = false;
      loginSubmit.textContent = '登录';
      loginForm.reset();
      loginPass.type = 'password';
      togglePass.classList.remove('visible');

      closeLogin();
    }, 700);
  });

  /* ---------- 关闭交互 ---------- */
  modalClose.addEventListener('click', closeLogin);

  overlay.addEventListener('click', function(e){
    if (e.target === overlay) closeLogin();
  });

  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeLogin();
  });

  /* ---------- 密码显示 / 隐藏 ---------- */
  togglePass.addEventListener('click', function(){
    var isPass = loginPass.type === 'password';
    loginPass.type = isPass ? 'text' : 'password';
    togglePass.classList.toggle('visible', isPass);
    togglePass.setAttribute('aria-label', isPass ? '隐藏密码' : '显示密码');
  });

  /* ---------- 点击别处收起用户菜单 ---------- */
  document.addEventListener('click', function(e){
    if (e.target.closest('.user-menu') || e.target.closest('.user-chip')) return;
    var menu = document.getElementById('userMenu');
    var chip = document.getElementById('userChip');
    if (menu && !menu.hasAttribute('hidden')){
      menu.setAttribute('hidden','');
      if (chip) chip.setAttribute('aria-expanded','false');
    }
  });

  /* ---------- 镜面高光跟随鼠标 ---------- */
  document.querySelectorAll('.glass').forEach(function(el){
    el.addEventListener('pointermove', function(e){
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((e.clientX - r.left) / r.width  * 100).toFixed(1) + '%');
      el.style.setProperty('--my', ((e.clientY - r.top ) / r.height * 100).toFixed(1) + '%');
    });
  });

  /* ---------- 滚动渐入 ---------- */
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if (en.isIntersecting){
        en.target.classList.add('in');
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(function(el, i){
    el.style.transitionDelay = (i % 6) * 70 + 'ms';
    io.observe(el);
  });

  /* ---------- 初始化登录状态 ---------- */
  currentUser = loadUser();
  renderUser();

})();
