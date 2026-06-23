/**
 * 博客主交互脚本
 * 轮播 · 折叠区块 · 小猫抽屉 · 主题/语言切换 · 天气特效
 */
(function () {
  'use strict';

  var SHOWCASE_SLIDES = [
    {
      img: 'https://images.unsplash.com/photo-1522441815192-d9f04eb0615c?auto=format&fit=crop&w=1200&q=80',
      title: '记录生活，分享技术',
      desc: '持续学习，持续成长',
      link: 'archives/'
    },
    {
      img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
      title: '一期一会',
      desc: '珍惜每一次相遇与记录',
      link: 'domain/'
    },
    {
      img: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1200&q=80',
      title: '极简之美',
      desc: '在简约中寻找生活的诗意',
      link: 'about/'
    }
  ];

  var DEMO_PROJECTS = [
    {
      slug: "blog-setup",
      img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
      title: "博客建立",
      subtitle: "Obsidian 笔记库 + Hexo 博客工程与发布流程",
      desc: "Obsidian 笔记库 + Hexo 博客工程与发布流程",
      tags: ["Hexo", "Obsidian"],
      link: "projects/blog-setup/",
      date: "2026/6/23"
    },
    {
      slug: "latex2word",
      img: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80",
      title: "latex2word",
      subtitle: "LaTeX 公式与文档向 Word 的转换",
      desc: "LaTeX 公式与文档向 Word 的转换",
      tags: ["LaTeX", "Word"],
      link: "projects/latex2word/",
      date: "2026/6/23"
    },
    {
      slug: "research-group",
      img: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
      title: "课题组研究方向整理",
      subtitle: "研究方向、成员与文献的结构化汇总",
      desc: "研究方向、成员与文献的结构化汇总",
      tags: ["科研", "Zotero"],
      link: "projects/research-group/",
      date: "2026/6/23"
    }
  ];

  var MUSIC_TRACKS = [
    { name: 'Spring Breeze', url: '' },
    { name: 'Rainy Forest', url: '' },
    { name: 'Cherry Blossom', url: '' }
  ];

  var musicIndex = 0;
  var isPlaying = false;
  var carouselTimer = null;

  /* ===== 主题与天气特效 ===== */
  function isProjectPage() {
    return document.body.classList.contains('type-project')
      || document.body.classList.contains('type-projects')
      || /\/projects(?:\/|$)/.test((window.location.pathname || '').replace(/\/index\.html$/, ''));
  }

  /** 文章页、项目页：雨水下落速度强制为 0，保留密度与静态画面 */
  function shouldFreezeRainMotion() {
    return isPostPage() || isProjectPage();
  }

  function syncRainReadingMode() {
    if (!window.RainEngine) return;
    if (shouldFreezeRainMotion()) {
      window.RainEngine.setSpeedOverride(0);
    } else {
      window.RainEngine.clearSpeedOverride();
    }
  }

  function applyWeather() {
    var theme = document.documentElement.getAttribute('data-theme') || 'light';
    if (theme === 'dark') {
      if (window.SakuraEngine) window.SakuraEngine.stop();
      if (window.RainEngine) window.RainEngine.start();
    } else {
      if (window.RainEngine) window.RainEngine.stop();
      if (window.SakuraEngine) window.SakuraEngine.start();
    }
    syncRainReadingMode();
  }

function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme') || 'light';
    var next = current === 'light' ? 'dark' : 'light';
    if (window.btf) {
      next === 'dark' ? window.btf.activateDarkMode() : window.btf.activateLightMode();
    } else {
      document.documentElement.setAttribute('data-theme', next);
    }
    if (window.btf && window.btf.saveToLocal) {
      window.btf.saveToLocal.set('theme', next, 999);
    } else {
      localStorage.setItem('theme', next);
    }
    applyWeather();
    updateThemeLabel();
  }

  function updateThemeLabel() {
    var el = document.getElementById('drawer-theme-label');
    if (!el) return;
    var theme = document.documentElement.getAttribute('data-theme') || 'light';
    el.textContent = theme === 'light' ? '切换夜间模式' : '切换日间模式';
    updateWeatherPanelVisibility();
  }

  function updateWeatherPanelVisibility() {
    var theme = document.documentElement.getAttribute('data-theme') || 'light';
    var sakuraPanel = document.getElementById('sakura-controls');
    var rainPanel = document.getElementById('rain-controls');
    if (sakuraPanel) sakuraPanel.style.display = theme === 'light' ? 'block' : 'none';
    if (rainPanel) rainPanel.style.display = theme === 'dark' ? 'block' : 'none';
  }

  function bindWeatherSliders() {
    var sakuraCount = document.getElementById('sakura-count');
    var sakuraSpeed = document.getElementById('sakura-speed');
    var rainCount = document.getElementById('rain-count');
    var rainSpeed = document.getElementById('rain-speed');

    if (window.SakuraEngine) {
      var ss = window.SakuraEngine.getSettings();
      if (sakuraCount) { sakuraCount.value = ss.density; }
      if (sakuraSpeed) { sakuraSpeed.value = ss.speed; }
      syncSakuraLabels(ss.density, ss.speed);
    }
    if (window.RainEngine) {
      var rs = window.RainEngine.getSettings();
      if (rainCount) { rainCount.value = rs.density; }
      if (rainSpeed) { rainSpeed.value = rs.speed; }
      syncRainLabels(rs.density, rs.speed);
    }

    if (sakuraCount) {
      sakuraCount.addEventListener('input', function () {
        var val = window.SakuraEngine.setDensity(this.value);
        syncSakuraLabels(val, sakuraSpeed ? sakuraSpeed.value : 1);
      });
    }
    if (sakuraSpeed) {
      sakuraSpeed.addEventListener('input', function () {
        var val = window.SakuraEngine.setSpeed(this.value);
        syncSakuraLabels(sakuraCount ? sakuraCount.value : 35, val);
      });
    }
    if (rainCount) {
      rainCount.addEventListener('input', function () {
        var val = window.RainEngine.setDensity(this.value);
        syncRainLabels(val, rainSpeed ? rainSpeed.value : 1);
      });
    }
    if (rainSpeed) {
      rainSpeed.addEventListener('input', function () {
        var val = window.RainEngine.setSpeed(this.value);
        syncRainLabels(rainCount ? rainCount.value : 30, val);
      });
    }

    var sakuraReset = document.getElementById('sakura-reset');
    var rainReset = document.getElementById('rain-reset');
    if (sakuraReset) {
      sakuraReset.addEventListener('click', function () {
        window.SakuraEngine.setDensity(35);
        window.SakuraEngine.setSpeed(1);
        if (sakuraCount) sakuraCount.value = 35;
        if (sakuraSpeed) sakuraSpeed.value = 1;
        syncSakuraLabels(35, 1);
      });
    }
    if (rainReset) {
      rainReset.addEventListener('click', function () {
        window.RainEngine.setDensity(30);
        window.RainEngine.setSpeed(1);
        if (rainCount) rainCount.value = 30;
        if (rainSpeed) rainSpeed.value = 1;
        syncRainLabels(30, 1);
      });
    }
  }

  function syncSakuraLabels(count, speed) {
    var countEl = document.getElementById('sakura-count-val');
    var speedEl = document.getElementById('sakura-speed-val');
    if (countEl) countEl.textContent = count + ' 片';
    if (speedEl) speedEl.textContent = parseFloat(speed).toFixed(1) + 'x';
  }

  function syncRainLabels(count, speed) {
    var countEl = document.getElementById('rain-count-val');
    var speedEl = document.getElementById('rain-speed-val');
    if (countEl) countEl.textContent = count + ' 滴';
    if (speedEl) speedEl.textContent = parseFloat(speed).toFixed(1) + 'x';
  }

  /* ===== 滚动进度条 ===== */
  function initScrollProgress() {
    if (document.getElementById('scroll-progress-bar')) return;
    var bar = document.createElement('div');
    bar.id = 'scroll-progress-bar';
    document.body.appendChild(bar);
    window.addEventListener('scroll', function () {
      var scroll = document.documentElement.scrollTop || document.body.scrollTop;
      var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      bar.style.width = (height > 0 ? (scroll / height) * 100 : 0) + '%';
    });
  }

  /* ===== 首页轮播（仅插入 #recent-posts 内部，不破坏 .layout 结构） ===== */
  function rootPath() {
    if (window.GLOBAL_CONFIG && GLOBAL_CONFIG.root) {
      var configured = GLOBAL_CONFIG.root;
      return configured.slice(-1) === '/' ? configured : configured + '/';
    }
    return '/';
  }

  /** 统一生成带站点 root 的链接，避免 /2026/... 或 /project/project/... */
  function resolveSiteUrl(path) {
    if (!path) return rootPath();
    path = String(path).trim();
    if (/^https?:\/\//i.test(path)) return path;

    var root = rootPath();
    var base = root.replace(/^\//, '').replace(/\/$/, '');

    path = path.replace(/^https?:\/\/[^/]+/, '');
    if (path.charAt(0) === '/') path = path.slice(1);

    if (base && (path.indexOf(base + '/') === 0 || path === base)) {
      return '/' + path;
    }
    return root + path;
  }

  function pageUrl(path) {
    return resolveSiteUrl(path);
  }

  /** 修正正文/系列页 Markdown 里缺少 root 前缀的站内链接 */
  function fixInternalArticleLinks(scope) {
    var selector = [
      '#article-container a[href^="/"]',
      '.page-content a[href^="/"]',
      '.md-content a[href^="/"]',
      '#page a[href^="/"]'
    ].join(', ');

    (scope || document).querySelectorAll(selector).forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href || href.indexOf('//') === 0) return;
      var fixed = resolveSiteUrl(href);
      if (fixed !== href) link.setAttribute('href', fixed);
    });
  }

  function bindViewMoreLinks(scope) {
    (scope || document).querySelectorAll('.section-block .view-more').forEach(function (link) {
      if (link.dataset.bound) return;
      link.dataset.bound = '1';
      link.addEventListener('mousedown', function (e) {
        e.stopPropagation();
      });
      link.addEventListener('click', function (e) {
        e.stopPropagation();
        var href = link.getAttribute('href');
        if (href) window.location.href = href;
      });
    });
  }

  function syncHomeSectionsLayout() {
    var posts = document.getElementById('recent-posts');
    if (!posts) return;
    posts.classList.toggle(
      'has-expanded-section',
      !!posts.querySelector('.section-block.expanded')
    );
  }

  function bindSectionToggles(scope) {
    (scope || document).querySelectorAll('.section-toggle').forEach(function (btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var block = btn.closest('.section-block');
        var icon = btn.querySelector('.toggle-icon');
        if (!block) return;
        var willExpand = !block.classList.contains('expanded');
        block.classList.toggle('expanded', willExpand);
        btn.setAttribute('aria-expanded', willExpand ? 'true' : 'false');
        if (icon) icon.classList.toggle('expanded', willExpand);
        syncHomeSectionsLayout();
      });
    });
  }

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatFeedDate(raw) {
    if (!raw) return '';
    var parts = raw.split('-');
    if (parts.length === 3) {
      return parts[0] + '/' + parseInt(parts[1], 10) + '/' + parseInt(parts[2], 10);
    }
    return raw.replace(/-/g, '/');
  }

  function pathFromHref(href) {
    if (!href) return '';
    return href.replace(/^https?:\/\/[^/]+/, '')
      .replace(/^\/project/, '')
      .replace(/\/index\.html$/, '/')
      .replace(/^\//, '');
  }

  function loadHomePostsMetaMap() {
    var map = {};
    var el = document.getElementById('home-posts-meta');
    if (!el) return map;
    try {
      JSON.parse(el.textContent).forEach(function (item) {
        var key = String(item.path || '').replace(/^\//, '').replace(/\/$/, '');
        map[key] = item;
      });
    } catch (err) { /* ignore */ }
    return map;
  }

  function loadPostMetaMap() {
    var map = loadHomePostsMetaMap();
    var subtitleMap = {};
    Object.keys(map).forEach(function (key) {
      subtitleMap[key] = map[key].subtitle || '';
    });
    return subtitleMap;
  }

  function getShowcaseSlides() {
    var el = document.getElementById('home-posts-meta');
    if (!el) return SHOWCASE_SLIDES.slice();

    try {
      var posts = JSON.parse(el.textContent);
      var showcasePosts = posts.filter(function (p) { return p.showcase; })
        .sort(function (a, b) { return (b.sticky || 0) - (a.sticky || 0); });

      if (!showcasePosts.length) return SHOWCASE_SLIDES.slice();

      return showcasePosts.map(function (p) {
        return {
          img: p.cover || SHOWCASE_SLIDES[0].img,
          title: p.title,
          desc: p.subtitle || '',
          link: p.path,
          pinned: true
        };
      });
    } catch (err) {
      return SHOWCASE_SLIDES.slice();
    }
  }

  function buildTagsHtml(tags) {
    if (!tags || !tags.length) return '';
    return tags.map(function (tag) {
      return '<span class="feed-tag"># ' + escapeHtml(tag) + '</span>';
    }).join('');
  }

  function buildFeedCard(opts) {
    var href = resolveSiteUrl(opts.link || opts.href || '');
    var hasCover = opts.cover !== false && !!opts.img;
    var tags = opts.tags || (opts.tag ? [opts.tag] : []);
    var pinHtml = opts.pinned
      ? '<span class="feed-pin" title="置顶"><i class="fas fa-thumbtack" aria-hidden="true"></i></span>'
      : '';
    var cardClass = 'feed-card feed-card-ready recent-post-item' + (hasCover ? ' feed-card--has-cover' : ' feed-card--no-cover');

    var thumbHtml = hasCover
      ? '<a class="feed-thumb" href="' + href + '" title="' + escapeHtml(opts.title) + '">' +
        '<img src="' + opts.img + '" alt="' + escapeHtml(opts.title) + '"></a>'
      : '';

    return '<article class="' + cardClass + '">' + thumbHtml +
      '<div class="feed-body">' +
      '<div class="feed-row-title">' +
      '<a class="feed-title" href="' + href + '">' + pinHtml + escapeHtml(opts.title) + '</a>' +
      (opts.date ? '<time class="feed-date">' + escapeHtml(opts.date) + '</time>' : '') +
      '</div>' +
      '<div class="feed-row-sub">' +
      (opts.subtitle ? '<p class="feed-subtitle">' + escapeHtml(opts.subtitle) + '</p>' : '') +
      (tags.length ? '<div class="feed-tags">' + buildTagsHtml(tags) + '</div>' : '') +
      '</div>' +
      (opts.desc ? '<p class="feed-desc">' + escapeHtml(opts.desc) + '</p>' : '') +
      '</div></article>';
  }

  function enhanceFeedCards(scope) {
    var metaMap = loadHomePostsMetaMap();
    var cards = (scope || document).querySelectorAll('.recent-post-item:not(.feed-card-ready)');

    cards.forEach(function (item) {
      if (item.classList.contains('feed-card-ready')) return;

      var titleEl = item.querySelector('.article-title');
      if (!titleEl) return;

      var href = titleEl.getAttribute('href') || '';
      var postKey = pathFromHref(href).replace(/\/$/, '');
      var meta = metaMap[postKey] || {};
      var subtitle = meta.subtitle || item.dataset.subtitle || '';
      var titleText = titleEl.textContent.replace(/\s+/g, ' ').trim();
      var timeEl = item.querySelector('time');
      var dateText = timeEl ? formatFeedDate(timeEl.textContent.trim()) : '';
      var tagEls = item.querySelectorAll('.article-meta__tags');
      var tags = [];
      tagEls.forEach(function (el) {
        var t = el.textContent.trim();
        if (t) tags.push(t);
      });
      var descEl = item.querySelector('.content');
      var descText = descEl ? descEl.textContent.replace(/\s+/g, ' ').trim() : '';
      var imgEl = item.querySelector('.post_cover img, .post_cover .post-bg');
      var imgSrc = imgEl ? (imgEl.getAttribute('data-lazy-src') || imgEl.getAttribute('src') || '') : '';
      var noCover = item.querySelector('.recent-post-info.no-cover') || !item.querySelector('.post_cover');
      if (imgSrc && imgSrc.indexOf('data:image/gif') === 0) imgSrc = imgEl.getAttribute('data-lazy-src') || '';

      var cardHtml = buildFeedCard({
        href: href,
        title: titleText,
        subtitle: subtitle,
        desc: descText,
        tags: tags,
        date: dateText,
        img: noCover ? false : imgSrc,
        cover: noCover ? false : true,
        pinned: (meta.sticky || 0) > 0
      });

      var wrapper = document.createElement('div');
      wrapper.innerHTML = cardHtml;
      var newCard = wrapper.firstElementChild;
      item.replaceWith(newCard);
    });

    (scope || document).querySelectorAll('.feed-card').forEach(function (card) {
      card.classList.add('feed-card-ready');
    });

    (scope || document).querySelectorAll(
      '#recent-posts .feed-title, #recent-posts .feed-thumb, #recent-posts .view-more'
    ).forEach(function (anchor) {
      var raw = anchor.getAttribute('href');
      if (raw) anchor.setAttribute('href', resolveSiteUrl(raw));
    });
  }

  function projectItemUrl(project) {
    var path = project && project.link ? project.link : 'projects/';
    return pageUrl(path);
  }

  function fixHomeProjectLinks(scope) {
    var root = scope || document;
    root.querySelectorAll('#project-body .feed-title, #project-body .feed-thumb').forEach(function (anchor, index) {
      var project = DEMO_PROJECTS[index];
      if (!project) return;
      anchor.setAttribute('href', projectItemUrl(project));
    });
  }

  function buildProjectPostItem(project) {
    var href = projectItemUrl(project);
    return buildFeedCard({
      link: href,
      href: href,
      title: project.title,
      subtitle: project.subtitle,
      desc: project.desc,
      tags: project.tags || [],
      date: project.date,
      img: project.img
    });
  }

  function removeHomePagination() {
    var posts = document.getElementById('recent-posts');
    if (!posts) return;
    posts.querySelectorAll('#pagination, .pagination').forEach(function (el) {
      el.remove();
    });
  }

  function initShowcase() {
    var posts = document.getElementById('recent-posts');
    if (!posts || posts.querySelector('.home-showcase')) return;

    var slides = getShowcaseSlides();
    var html = '<div class="home-showcase">';
    slides.forEach(function (s, i) {
      var pinHtml = s.pinned
        ? '<span class="showcase-pin"><i class="fas fa-thumbtack" aria-hidden="true"></i> 置顶推荐</span>'
        : '';
      html += '<div class="slide' + (i === 0 ? ' active' : '') + '">' +
        '<img src="' + escapeHtml(s.img) + '" alt="' + escapeHtml(s.title) + '">' +
        '<div class="slide-overlay">' +
        pinHtml +
        '<h2>' + escapeHtml(s.title) + '</h2><p>' + escapeHtml(s.desc) + '</p>' +
        '<a class="explore-btn" href="' + pageUrl(s.link) + '">阅读全文 →</a>' +
        '</div></div>';
    });
    html += '<div class="dots">';
    slides.forEach(function (_, i) {
      html += '<div class="dot' + (i === 0 ? ' active' : '') + '" data-idx="' + i + '"></div>';
    });
    html += '</div></div>';

    posts.insertAdjacentHTML('afterbegin', html);

    var banner = posts.querySelector('.home-showcase');
    var slideEls = banner.querySelectorAll('.slide');
    var dots = banner.querySelectorAll('.dot');
    var current = 0;

    function show(idx) {
      slideEls.forEach(function (s, i) { s.classList.toggle('active', i === idx); });
      dots.forEach(function (d, i) { d.classList.toggle('active', i === idx); });
      current = idx;
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(parseInt(this.dataset.idx, 10));
        resetCarousel();
      });
    });

    function next() {
      if (slideEls.length <= 1) return;
      show((current + 1) % slideEls.length);
    }

    function resetCarousel() {
      clearInterval(carouselTimer);
      if (slideEls.length > 1) {
        carouselTimer = setInterval(next, 5000);
      }
    }

    resetCarousel();
  }

  /* ===== 折叠区块（全部保留在 #recent-posts 内） ===== */
  function wrapSections() {
    var posts = document.getElementById('recent-posts');
    if (!posts || posts.querySelector('.section-block')) return;

    var items = posts.querySelector('.recent-post-items');
    if (!items) return;

    var blogBlock = document.createElement('div');
    blogBlock.className = 'section-block';
    blogBlock.innerHTML =
      '<div class="section-header">' +
      '<button type="button" class="section-toggle" data-target="blog-body" aria-expanded="false">' +
      '<h2>最新博客</h2><span class="toggle-icon">▼</span></button>' +
      '<a class="view-more" href="' + pageUrl('archives/') + '">查看更多 →</a></div>' +
      '<div class="section-body section-scroll" id="blog-body"></div>';

    items.parentNode.insertBefore(blogBlock, items);
    blogBlock.querySelector('#blog-body').appendChild(items);

    var projectBlock = document.createElement('div');
    projectBlock.className = 'section-block';
    projectBlock.innerHTML =
      '<div class="section-header">' +
      '<button type="button" class="section-toggle" data-target="project-body" aria-expanded="false">' +
      '<h2>热门项目</h2><span class="toggle-icon">▼</span></button>' +
      '<a class="view-more" href="' + pageUrl('projects/') + '">查看更多 →</a></div>' +
      '<div class="section-body section-scroll" id="project-body">' +
      '<div class="recent-post-items">' +
      DEMO_PROJECTS.map(buildProjectPostItem).join('') +
      '</div></div>';

    posts.appendChild(projectBlock);
    removeHomePagination();

    bindViewMoreLinks(posts);
    bindSectionToggles(posts);
    enhanceFeedCards(posts);
    fixHomeProjectLinks(posts);
    initSectionMotion(posts);
  }

  function initSectionMotion(scope) {
    var blocks = (scope || document).querySelectorAll('.section-block');
    if (!blocks.length) return;

    blocks.forEach(function (block, index) {
      block.classList.add('section-reveal');
      block.style.setProperty('--reveal-delay', (index * 0.14) + 's');

      block.querySelectorAll('.feed-card').forEach(function (card, cardIndex) {
        card.style.setProperty('--card-delay', (0.08 + cardIndex * 0.05) + 's');
      });
    });

    if (!('IntersectionObserver' in window)) {
      blocks.forEach(function (block) { block.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -8% 0px'
    });

    blocks.forEach(function (block) { observer.observe(block); });
  }

  /* ===== 小猫抽屉 ===== */
  function initCatDrawer() {
    if (document.querySelector('.cat-trigger')) return;

    var overlay = document.createElement('div');
    overlay.className = 'drawer-overlay';
    document.body.appendChild(overlay);

    var trigger = document.createElement('div');
    trigger.className = 'cat-trigger';
    trigger.title = '打开设置面板';
    trigger.innerHTML = '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="50" cy="55" r="35" fill="#fff" stroke="#ffb7c5" stroke-width="2"/>' +
      '<polygon points="25,25 35,42 15,42" fill="#fff" stroke="#ffb7c5" stroke-width="1.5"/>' +
      '<polygon points="75,25 65,42 85,42" fill="#fff" stroke="#ffb7c5" stroke-width="1.5"/>' +
      '<circle cx="38" cy="50" r="4" fill="#4a4a4a"/><circle cx="62" cy="50" r="4" fill="#4a4a4a"/>' +
      '<ellipse cx="50" cy="58" rx="3" ry="2" fill="#ffb7c5"/>' +
      '<path d="M42 65 Q50 72 58 65" stroke="#4a4a4a" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '</svg>';
    document.body.appendChild(trigger);

    var drawer = document.createElement('div');
    drawer.className = 'hidden-drawer';
    drawer.innerHTML =
      '<div class="drawer-title">🐱 设置面板</div>' +
      '<div class="weather-panel" id="sakura-controls">' +
      '<div class="weather-panel-title">🌸 樱花特效</div>' +
      '<div class="slider-row">' +
      '<div class="slider-label"><span>樱花数量</span><span id="sakura-count-val">35 片</span></div>' +
      '<input type="range" id="sakura-count" min="5" max="100" step="1" value="35">' +
      '</div>' +
      '<div class="slider-row">' +
      '<div class="slider-label"><span>飘落速度</span><span id="sakura-speed-val">1.0x</span></div>' +
      '<input type="range" id="sakura-speed" min="0.3" max="3" step="0.1" value="1">' +
      '</div>' +
      '<button class="weather-reset" id="sakura-reset" type="button">恢复默认</button>' +
      '</div>' +
      '<div class="weather-panel" id="rain-controls" style="display:none">' +
      '<div class="weather-panel-title">🌧️ 雨水特效</div>' +
      '<div class="slider-row">' +
      '<div class="slider-label"><span>雨滴密度</span><span id="rain-count-val">30 滴</span></div>' +
      '<input type="range" id="rain-count" min="0" max="200" step="1" value="30">' +
      '</div>' +
      '<div class="slider-row">' +
      '<div class="slider-label"><span>下落速度</span><span id="rain-speed-val">1.0x</span></div>' +
      '<input type="range" id="rain-speed" min="0" max="3" step="0.1" value="1">' +
      '</div>' +
      '<button class="weather-reset" id="rain-reset" type="button">恢复默认</button>' +
      '</div>' +
      '<div class="music-panel">' +
      '<div class="music-title" id="music-info">🎵 轻音乐 · 未播放</div>' +
      '<div class="music-controls">' +
      '<button id="music-prev" title="上一首">⏮</button>' +
      '<button id="music-play" title="播放/暂停">▶</button>' +
      '<button id="music-next" title="下一首">⏭</button>' +
      '</div></div>' +
      '<div class="drawer-item" id="drawer-theme">' +
      '<i>🌓</i><span id="drawer-theme-label">切换夜间模式</span></div>' +
      '<div class="drawer-item" id="drawer-lang">' +
      '<i>🌐</i><span id="drawer-lang-label">切换 English</span></div>' +
      '<div class="drawer-item" id="drawer-vault">' +
      '<i>🔒</i><span>私密目录</span></div>' +
      '<div class="drawer-item" id="drawer-close">' +
      '<i>✕</i><span>关闭面板</span></div>';
    document.body.appendChild(drawer);

    function openDrawer() {
      drawer.classList.add('open');
      overlay.classList.add('visible');
    }
    function closeDrawer() {
      drawer.classList.remove('open');
      overlay.classList.remove('visible');
    }

    trigger.addEventListener('click', openDrawer);
    overlay.addEventListener('click', closeDrawer);
    document.getElementById('drawer-close').addEventListener('click', closeDrawer);
    document.getElementById('drawer-theme').addEventListener('click', toggleTheme);
    document.getElementById('drawer-vault').addEventListener('click', function () {
      window.location.href = pageUrl('vault/');
    });
    document.getElementById('drawer-lang').addEventListener('click', toggleLanguage);

    document.getElementById('music-play').addEventListener('click', function () {
      isPlaying = !isPlaying;
      this.textContent = isPlaying ? '⏸' : '▶';
      document.getElementById('music-info').textContent =
        isPlaying ? '🎵 正在播放: ' + MUSIC_TRACKS[musicIndex].name : '🎵 已暂停';
    });
    document.getElementById('music-prev').addEventListener('click', function () {
      musicIndex = (musicIndex - 1 + MUSIC_TRACKS.length) % MUSIC_TRACKS.length;
      document.getElementById('music-info').textContent =
        '🎵 ' + (isPlaying ? '正在播放: ' : '') + MUSIC_TRACKS[musicIndex].name;
    });
    document.getElementById('music-next').addEventListener('click', function () {
      musicIndex = (musicIndex + 1) % MUSIC_TRACKS.length;
      document.getElementById('music-info').textContent =
        '🎵 ' + (isPlaying ? '正在播放: ' : '') + MUSIC_TRACKS[musicIndex].name;
    });

    updateThemeLabel();
    bindWeatherSliders();
    updateWeatherPanelVisibility();
  }

  /* ===== 语言切换 ===== */
  var LANG_MAP = {
    '文章': 'Articles', '项目': 'Projects', '动态': 'Moments',
    '专题': 'Domains', '标签': 'Tags', '关于我': 'About', '最新博客': 'Latest Posts',
    '热门项目': 'Hot Projects', '切换 English': 'Switch 中文',
    '切换夜间模式': 'Switch Dark Mode', '切换日间模式': 'Switch Light Mode',
    '私密目录': 'Private Vault', '关闭面板': 'Close Panel',
    '设置面板': 'Settings', '探索更多 →': 'Explore →', '查看更多 →': 'View More →'
  };
  var LANG_MAP_REV = {};
  Object.keys(LANG_MAP).forEach(function (k) { LANG_MAP_REV[LANG_MAP[k]] = k; });

  function toggleLanguage() {
    var isZh = document.documentElement.lang !== 'en';
    document.documentElement.lang = isZh ? 'en' : 'zh-CN';
    localStorage.setItem('blog-lang', isZh ? 'en' : 'zh');

    var map = isZh ? LANG_MAP : LANG_MAP_REV;
    document.querySelectorAll('#nav .site-page span, .section-header h2, .drawer-item span, .drawer-title, .explore-btn, .view-more, #drawer-lang-label').forEach(function (el) {
      var text = el.textContent.trim();
      if (map[text]) el.textContent = map[text];
    });

    var langLabel = document.getElementById('drawer-lang-label');
    if (langLabel) langLabel.textContent = isZh ? 'Switch 中文' : '切换 English';
  }

  /* ===== 导航高亮 ===== */
  function highlightNav() {
    var path = window.location.pathname;
    var root = (window.GLOBAL_CONFIG && GLOBAL_CONFIG.root) || '/';
    document.querySelectorAll('#nav .menus_items .menus_item .site-page[href]').forEach(function (link) {
      var href = link.getAttribute('href') || '';
      if (!href || href.indexOf('javascript') === 0) return;
      var normalized = href.replace(/\/index\.html$/, '/');
      var isHome = normalized === root || normalized === root.replace(/\/$/, '') + '/';
      var active = isHome
        ? (path === root || path === root.slice(0, -1) || path === root + 'index.html')
        : path.indexOf(normalized.replace(/\/$/, '')) === 0;
      link.classList.toggle('active', active);
    });
  }

  function enhanceNavSearch() {
    var searchBtn = document.querySelector('#search-button .search');
    if (!searchBtn || searchBtn.dataset.enhanced) return;
    searchBtn.dataset.enhanced = '1';

    var placeholder = (window.GLOBAL_CONFIG &&
      GLOBAL_CONFIG.localSearch &&
      GLOBAL_CONFIG.localSearch.placeholder) ||
      '可搜索标题、标签以及文章内任意内容';

    searchBtn.querySelectorAll('span').forEach(function (span) {
      if (!span.classList.contains('search-placeholder')) span.remove();
    });

    if (!searchBtn.querySelector('.search-placeholder')) {
      var ph = document.createElement('span');
      ph.className = 'search-placeholder';
      ph.textContent = placeholder;
      searchBtn.appendChild(ph);
    }
  }

  /* ===== 初始化 ===== */
  function fixLazyImages() {
    document.querySelectorAll('#nav img[data-lazy-src], #aside-content img[data-lazy-src]').forEach(function (img) {
      if (img.dataset.lazySrc) {
        img.src = img.dataset.lazySrc;
        img.removeAttribute('data-lazy-src');
      }
    });
  }

  function preloadSceneBackgrounds() {
    [rootPath() + 'img/bg-day-sakura.png', rootPath() + 'img/bg-night-overpass.png'].forEach(function (src) {
      var img = new Image();
      img.src = src;
    });
  }

  /* ===== 文章页头部 ===== */
  function initPostHeader() {
    var metaEl = document.getElementById('post-header-meta');
    var postInfo = document.getElementById('post-info');
    if (!metaEl || !postInfo || postInfo.dataset.heroReady) return;

    var meta;
    try {
      meta = JSON.parse(metaEl.textContent);
    } catch (err) {
      return;
    }

    postInfo.dataset.heroReady = '1';
    postInfo.classList.add('post-hero');

    var cover = meta.cover && meta.cover !== 'false' ? meta.cover : '';
    var coverHtml = cover
      ? '<div class="post-hero__cover"><img src="' + escapeHtml(cover) + '" alt="" loading="lazy"></div>'
      : '';

    var seriesHref = meta.seriesPath
      ? resolveSiteUrl(meta.seriesPath)
      : (meta.series ? resolveSiteUrl('series/' + String(meta.series).toLowerCase().replace(/\s+/g, '-') + '/') : '');

    var seriesHtml = meta.series
      ? '<a class="post-hero__series" href="' + seriesHref + '"><i class="fas fa-layer-group"></i><span>系列 · ' +
        escapeHtml(meta.series) + '</span></a>'
      : '';

    var subtitleHtml = meta.subtitle
      ? '<p class="post-hero__subtitle">' + escapeHtml(meta.subtitle) + '</p>'
      : '';

    var tagsHtml = (meta.tags || []).map(function (t) {
      return '<button type="button" class="post-hero__chip post-hero__chip--tag js-post-tag-filter" data-tag-name="' +
        escapeHtml(t.name) + '">#' + escapeHtml(t.name) + '</button>';
    }).join('');

    var catsHtml = (meta.categories || []).map(function (c) {
      return '<a class="post-hero__chip post-hero__chip--cat" href="' + resolveSiteUrl(c.path) + '">' +
        escapeHtml(c.name) + '</a>';
    }).join('');

    var authorHtml = meta.author
      ? '<span class="post-hero__chip post-hero__chip--muted"><i class="fas fa-user"></i> ' + escapeHtml(meta.author) + '</span>'
      : '';

    var readHtml = meta.readTime
      ? '<span class="post-hero__chip post-hero__chip--muted"><i class="far fa-clock"></i> ' + escapeHtml(meta.readTime) + '</span>'
      : '';

    var dateCreated = meta.date ? formatFeedDate(meta.date) : '';
    var dateUpdated = meta.updated && meta.updated !== meta.date ? formatFeedDate(meta.updated) : '';

    var datesHtml =
      '<div class="post-hero__dates">' +
      '<span class="post-hero__date"><i class="far fa-calendar-alt"></i> 发布 ' + escapeHtml(dateCreated) + '</span>' +
      (dateUpdated
        ? '<span class="post-hero__date"><i class="fas fa-history"></i> 更新 ' + escapeHtml(dateUpdated) + '</span>'
        : '') +
      '</div>';

    var chips = [authorHtml, readHtml, catsHtml, tagsHtml].filter(Boolean).join('');
    var chipsHtml = chips ? '<div class="post-hero__chips">' + chips + '</div>' : '';

    postInfo.innerHTML =
      coverHtml +
      '<div class="post-hero__inner">' +
      (seriesHtml ? '<div class="post-hero__topline">' + seriesHtml + '</div>' : '') +
      '<h1 class="post-title post-hero__title">' + escapeHtml(meta.title) + '</h1>' +
      subtitleHtml +
      datesHtml +
      chipsHtml +
      '</div>';
  }

  /* ===== 归档页 /archives/ ===== */
  function isArchivesPage() {
    return !!document.getElementById('archive')
      || (window.GLOBAL_CONFIG_SITE && window.GLOBAL_CONFIG_SITE.pageType === 'archive')
      || /\/archives\/?$/.test((window.location.pathname || '').replace(/\/index\.html$/, ''));
  }

  function loadArchivePageData() {
    var el = document.getElementById('archive-page-data');
    if (!el) return null;
    try {
      return JSON.parse(el.textContent);
    } catch (err) {
      return null;
    }
  }

  function postKeyFromHref(href) {
    return pathFromHref(href).replace(/\/$/, '');
  }

  /** 归档时间轴：仅月-日 */
  function formatArchiveDateMD(dateStr) {
    if (!dateStr) return '';
    var raw = String(dateStr).trim();
    if (raw.indexOf('T') !== -1) raw = raw.split('T')[0];
    var parts = raw.split('-');
    if (parts.length >= 3) {
      return parseInt(parts[1], 10) + '/' + parseInt(parts[2], 10);
    }
    return raw;
  }

  function buildArchiveCardHtml(opts) {
    var href = resolveSiteUrl(opts.href);
    var dateLabel = formatArchiveDateMD(opts.date);
    var tagsHtml = (opts.tags || []).map(function (t) {
      return '<a class="archive-card__tag" href="' + resolveSiteUrl(t.path) + '">#' +
        escapeHtml(t.name) + '</a>';
    }).join('');

    var cardHtml = '<article class="archive-card">' +
      '<a class="archive-card__body" href="' + href + '">' +
      '<h3 class="archive-card__title">' + escapeHtml(opts.title) + '</h3>' +
      (opts.desc ? '<p class="archive-card__desc">' + escapeHtml(opts.desc) + '</p>' : '') +
      '</a>' +
      (tagsHtml ? '<div class="archive-card__tags">' + tagsHtml + '</div>' : '') +
      '</article>';

    return '<div class="archive-timeline__item">' +
      '<time class="archive-timeline__date"' +
      (opts.date ? ' datetime="' + escapeHtml(opts.date) + '"' : '') + '>' +
      escapeHtml(dateLabel) + '</time>' +
      cardHtml +
      '</div>';
  }

  function initArchivesPage() {
    if (!isArchivesPage()) return;

    var archive = document.getElementById('archive');
    if (!archive || archive.dataset.enhanced) return;

    var data = loadArchivePageData();
    var postMap = {};
    if (data && data.posts) {
      data.posts.forEach(function (p) {
        var key = String(p.path || '').replace(/^\//, '').replace(/\/$/, '');
        postMap[key] = p;
      });
    }

    archive.dataset.enhanced = '1';
    var bodyWrap = document.getElementById('body-wrap');
    if (bodyWrap) bodyWrap.classList.add('page-archive-enhanced');

    var total = (data && data.total) || archive.querySelectorAll('.article-sort-item:not(.year)').length;
    var year = (data && data.year) || new Date().getFullYear();

    var hero = document.createElement('section');
    hero.className = 'archive-hero';
    hero.innerHTML =
      '<div class="archive-hero__kicker">' +
      '<span class="archive-hero__vol">VOL. ' + year + '</span>' +
      '<span class="archive-hero__en">Article Archive</span></div>' +
      '<h1 class="archive-hero__title">文章归档<span class="archive-hero__dot">.</span></h1>' +
      '<div class="archive-hero__grid">' +
      '<div class="archive-hero__left">' +
      '<p class="archive-hero__label">The Archive</p>' +
      '<span class="archive-hero__est">EST. ' + year + '</span></div>' +
      '<div class="archive-hero__right">' +
      '<p class="archive-hero__stat">「文章总数: ' + total + '」</p>' +
      '<p class="archive-hero__summary">完整收录全部文章，共 ' + total +
      ' 篇内容，按时间线回溯阅读与检索。</p></div></div>';

    archive.insertBefore(hero, archive.firstChild);

    var sortTitle = archive.querySelector('.article-sort-title');
    if (sortTitle) sortTitle.style.display = 'none';

    var cardIndex = 0;
    archive.querySelectorAll('.article-sort-item').forEach(function (item) {
      if (item.classList.contains('year')) {
        item.classList.add('archive-year-label');
        return;
      }

      var titleLink = item.querySelector('.article-sort-item-title');
      if (!titleLink) return;

      var href = titleLink.getAttribute('href') || '';
      var key = postKeyFromHref(href);
      var meta = postMap[key] || {};
      var title = titleLink.textContent.replace(/\s+/g, ' ').trim();
      var desc = meta.subtitle || meta.excerpt || '';
      var timeEl = item.querySelector('.article-sort-item-time time');
      var dateStr = meta.date || (timeEl ? timeEl.getAttribute('datetime') : '');

      item.className = 'article-sort-item archive-list-item';
      item.setAttribute('data-tone', String(cardIndex % 4));
      cardIndex += 1;

      item.innerHTML = buildArchiveCardHtml({
        href: href,
        title: title,
        desc: desc,
        tags: meta.tags || [],
        date: dateStr
      });
    });
  }

  /* ===== 灵感盒（/domain/）：横向标签 + 领域切换 + domain index 内容 ===== */
  function isDomainHubPage() {
    return !!document.querySelector('#body-wrap.type-domain-hub, .type-domain-hub')
      || (window.location.pathname || '').replace(/\/index\.html$/, '').match(/\/project\/domain\/?$/)
      || (window.location.pathname || '').replace(/\/index\.html$/, '').match(/\/domain\/?$/);
  }

  function loadDomainHubData() {
    var el = document.getElementById('domain-hub-data');
    if (!el) return null;
    try {
      return JSON.parse(el.textContent);
    } catch (err) {
      return null;
    }
  }

  function buildTagPillsHtml(tags, duplicate) {
    var list = tags || [];
    if (!list.length) return '';
    var items = list.map(function (t) {
      return '<button type="button" class="domain-hub-tag-pill" data-tag-name="' +
        escapeHtml(t.name) + '"># ' + escapeHtml(t.name) + '</button>';
    }).join('');
    return duplicate ? items + items : items;
  }

  function buildHubPostCard(post) {
    var href = resolveSiteUrl(post.path);
    var cover = post.cover
      ? '<div class="domain-hub-post-cover"><img src="' + escapeHtml(post.cover) + '" alt="" loading="lazy"></div>'
      : '<div class="domain-hub-post-cover domain-hub-post-cover--empty"><span>🌸</span></div>';
    var tagLine = (post.tags || []).slice(0, 4).map(function (t) {
      return '<span class="domain-hub-post-tag">#' + escapeHtml(t) + '</span>';
    }).join('');

    return '<a class="domain-hub-post-card" href="' + href + '">' + cover +
      '<div class="domain-hub-post-body">' +
      '<h3 class="domain-hub-post-title">' + escapeHtml(post.title) + '</h3>' +
      (post.subtitle ? '<p class="domain-hub-post-sub">' + escapeHtml(post.subtitle) + '</p>' : '') +
      '<div class="domain-hub-post-meta">' +
      (post.series ? '<span class="domain-hub-post-series">' + escapeHtml(post.series) + '</span>' : '') +
      '<time>' + escapeHtml(post.date) + '</time>' +
      (tagLine ? '<div class="domain-hub-post-tags">' + tagLine + '</div>' : '') +
      '</div></div></a>';
  }

  function filterPostsByTag(posts, tagName) {
    if (!tagName) return [];
    return (posts || []).filter(function (post) {
      return (post.tags || []).indexOf(tagName) !== -1;
    });
  }

  function filterHubPostsByAllTags(posts, tagNames) {
    if (!tagNames || !tagNames.length) return [];
    return (posts || []).filter(function (post) {
      var names = post.tags || [];
      return tagNames.every(function (tag) {
        return names.indexOf(tag) !== -1;
      });
    });
  }

  /* 标签跑马灯恒定线速度（px/s）；时长由 JS 按内容宽度计算 */
  var DOMAIN_HUB_TAGS_MARQUEE_SPEED = 15;

  function syncDomainHubTagsMarquee(wrap) {
    if (!wrap) return;
    var inner = wrap.querySelector('.domain-hub-tags-inner');
    if (!inner) return;
    if (wrap.classList.contains('has-selection')) {
      inner.style.removeProperty('--domain-hub-tags-marquee-duration');
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var distance = inner.scrollWidth / 2;
    if (distance <= 0) return;
    inner.style.setProperty(
      '--domain-hub-tags-marquee-duration',
      (distance / DOMAIN_HUB_TAGS_MARQUEE_SPEED) + 's'
    );
  }

  function bindDomainHubTagsMarquee(wrap) {
    if (!wrap || wrap.dataset.marqueeBound) return;
    wrap.dataset.marqueeBound = '1';

    function scheduleSync() {
      requestAnimationFrame(function () {
        syncDomainHubTagsMarquee(wrap);
      });
    }

    scheduleSync();

    var inner = wrap.querySelector('.domain-hub-tags-inner');
    if (inner && typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(scheduleSync).observe(inner);
    } else {
      window.addEventListener('resize', scheduleSync);
    }
  }

  function rebuildDomainHubTags(wrap, tags, expanded) {
    if (!wrap) return;
    var inner = wrap.querySelector('.domain-hub-tags-inner');
    if (!inner) return;
    inner.innerHTML = buildTagPillsHtml(tags, !expanded);
    wrap.classList.toggle('has-selection', expanded);
    if (expanded) wrap.classList.remove('is-scrolling');
    syncDomainHubTagsMarquee(wrap);
  }

  function syncDomainHubTagPills(page, selectedTags) {
    page.querySelectorAll('.domain-hub-tag-pill').forEach(function (pill) {
      var name = pill.getAttribute('data-tag-name');
      pill.classList.toggle('active', selectedTags.indexOf(name) !== -1);
    });
  }

  function bindDomainHubTagsWheel(wrap) {
    if (!wrap || wrap.dataset.wheelBound) return;
    wrap.dataset.wheelBound = '1';

    var track = wrap.querySelector('.domain-hub-tags-track');
    var inner = wrap.querySelector('.domain-hub-tags-inner');
    if (!track || !inner) return;

    function syncScrollFromAnimation() {
      var matrix = new DOMMatrixReadOnly(window.getComputedStyle(inner).transform);
      var offset = Math.max(0, Math.round(-matrix.m41));
      var maxScroll = track.scrollWidth - track.clientWidth;
      track.scrollLeft = Math.min(offset, Math.max(0, maxScroll));
    }

    wrap.addEventListener('mouseenter', function () {
      if (wrap.classList.contains('has-selection')) return;
      wrap.classList.add('is-scrolling');
      syncScrollFromAnimation();
    });

    wrap.addEventListener('mouseleave', function () {
      if (wrap.classList.contains('has-selection')) return;
      wrap.classList.remove('is-scrolling');
      track.scrollLeft = 0;
      inner.style.transform = '';
    });

    wrap.addEventListener('wheel', function (e) {
      if (wrap.classList.contains('has-selection')) return;
      if (!wrap.classList.contains('is-scrolling')) return;
      var maxScroll = track.scrollWidth - track.clientWidth;
      if (maxScroll <= 0) return;

      var delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (delta === 0) return;

      e.preventDefault();
      track.scrollLeft += delta;
    }, { passive: false });
  }

  function renderTagPostsHtml(posts, tagLabel) {
    if (!posts.length) {
      return '<p class="domain-hub-tag-empty">暂无同时包含标签 <strong>#' +
        escapeHtml(tagLabel) + '</strong> 的文章。</p>';
    }
    return '<div class="domain-hub-post-waterfall">' +
      posts.map(buildHubPostCard).join('') + '</div>';
  }

  function buildSeriesCardsHtml(seriesList) {
    if (!seriesList || !seriesList.length) return '';
    return '<div class="domain-hub-series-cards">' + seriesList.map(function (s) {
      var href = s.path ? resolveSiteUrl(s.path) : '#';
      return '<a class="domain-hub-series-card" href="' + href + '">' +
        '<h3 class="domain-hub-series-name">' + escapeHtml(s.title || s.series) + '</h3>' +
        (s.subtitle ? '<p class="domain-hub-series-sub">' + escapeHtml(s.subtitle) + '</p>' : '') +
        (s.description ? '<p class="domain-hub-series-desc">' + escapeHtml(s.description) + '</p>' : '') +
        '<span class="domain-hub-series-link">查看系列索引 →</span></a>';
    }).join('') + '</div>';
  }

  function renderDomainPanel(domain) {
    return '<article class="domain-hub-panel-inner" data-domain-slug="' + escapeHtml(domain.slug) + '">' +
      '<header class="domain-hub-panel-head">' +
      '<h2 class="domain-hub-panel-title">' + escapeHtml(domain.title) + '</h2>' +
      (domain.subtitle ? '<p class="domain-hub-panel-subtitle">' + escapeHtml(domain.subtitle) + '</p>' : '') +
      '</header>' +
      buildSeriesCardsHtml(domain.series) +
      '<div class="domain-hub-panel-body">' + (domain.bodyHtml || '') + '</div>' +
      '</article>';
  }

  /* ===== 项目页 /projects/ ===== */
  function isProjectsPage() {
    return document.body.classList.contains('type-projects')
      || /\/projects\/?$/.test((window.location.pathname || '').replace(/\/index\.html$/, ''));
  }

  function buildProjectsPageCard(project, index) {
    var href = projectItemUrl(project);
    var tagsHtml = (project.tags || []).map(function (tag) {
      return '<span>' + escapeHtml(tag) + '</span>';
    }).join('');
    var desc = project.desc || project.subtitle || '';

    return '<a class="project-card" data-tone="' + (index % 4) + '" id="project-' + escapeHtml(project.slug || index) + '" href="' + href + '">' +
      '<img src="' + escapeHtml(project.img) + '" alt="' + escapeHtml(project.title) + '" loading="lazy">' +
      '<div class="project-info">' +
      '<h3>' + escapeHtml(project.title) + '</h3>' +
      '<p>' + escapeHtml(desc) + '</p>' +
      (tagsHtml ? '<div class="tech-tags">' + tagsHtml + '</div>' : '') +
      '</div></a>';
  }

  function getProjectsPageContentRoot(page) {
    return page.querySelector('#article-container')
      || page.querySelector('.page-content, .md-content');
  }

  function extractProjectsIndexTable(contentRoot) {
    if (!contentRoot) return null;

    var table = contentRoot.querySelector('table');
    if (!table) return null;

    contentRoot.querySelectorAll('p').forEach(function (p) {
      p.remove();
    });

    var indexSection = document.createElement('section');
    indexSection.className = 'projects-index-table';
    indexSection.appendChild(table);
    return indexSection;
  }

  function initProjectsPage() {
    if (!isProjectsPage()) return;

    var page = document.querySelector('#page');
    if (!page || page.querySelector('.projects-hub')) return;

    var pageTitle = page.querySelector('.page-title');
    var titleText = '热门项目';
    var subtitleText = '实战合集与开源实验';
    if (pageTitle) {
      titleText = pageTitle.textContent.replace(/\s+/g, ' ').trim() || titleText;
      pageTitle.style.display = 'none';
    }

    var contentRoot = getProjectsPageContentRoot(page);
    var indexTable = extractProjectsIndexTable(contentRoot);
    if (contentRoot) {
      contentRoot.style.display = 'none';
      contentRoot.setAttribute('aria-hidden', 'true');
    }

    var year = new Date().getFullYear();
    var total = DEMO_PROJECTS.length;
    var listHtml = DEMO_PROJECTS.map(buildProjectsPageCard).join('');

    var hub = document.createElement('div');
    hub.className = 'projects-hub';

    var hero = document.createElement('section');
    hero.className = 'projects-hero';
    hero.innerHTML =
      '<div class="projects-hero__kicker">' +
      '<span class="projects-hero__vol">VOL. ' + year + '</span>' +
      '<span class="projects-hero__en">Featured Projects</span></div>' +
      '<h1 class="projects-hero__title">' + escapeHtml(titleText) + '<span class="projects-hero__dot">.</span></h1>' +
      '<div class="projects-hero__grid">' +
      '<div class="projects-hero__left">' +
      '<p class="projects-hero__label">Projects</p>' +
      '<span class="projects-hero__badge">OPEN SOURCE</span></div>' +
      '<div class="projects-hero__right">' +
      '<p class="projects-hero__stat">「项目总数: ' + total + '」</p>' +
      '<p class="projects-hero__summary">' + escapeHtml(subtitleText) +
      ' — 下表为项目索引，卡片为各项目简介入口。</p></div></div>';

    hub.appendChild(hero);
    if (indexTable) hub.appendChild(indexTable);

    var listHeading = document.createElement('h2');
    listHeading.className = 'projects-list__heading';
    listHeading.textContent = '项目简介';
    hub.appendChild(listHeading);

    var listWrap = document.createElement('div');
    listWrap.className = 'projects-list';
    listWrap.innerHTML = listHtml;
    hub.appendChild(listWrap);

    page.insertBefore(hub, page.firstChild);
    fixInternalArticleLinks(hub);
    document.getElementById('body-wrap') && document.getElementById('body-wrap').classList.add('page-projects-enhanced');
  }

  /* ===== 文章页右侧固定目录 ===== */
  var POST_TOC_WIDTH = 252;
  var POST_TOC_BREAKPOINT = 1101;
  var postTocPositionRaf = null;

  function isPostPage() {
    return !!document.getElementById('post')
      || (window.GLOBAL_CONFIG_SITE && window.GLOBAL_CONFIG_SITE.pageType === 'post');
  }

  function getPostTocLayout() {
    return document.querySelector('#content-inner.layout.has-post-toc')
      || document.querySelector('#body-wrap > .layout.has-post-toc, main.layout.has-post-toc');
  }

  function teardownPostToc() {
    var portal = document.getElementById('post-toc-portal');
    if (portal) portal.remove();
    var spacer = document.getElementById('post-toc-aside');
    if (spacer) spacer.remove();
    var cardToc = document.getElementById('card-toc');
    if (cardToc) {
      cardToc.classList.remove('post-toc-card');
      cardToc.style.top = '';
      cardToc.style.left = '';
      cardToc.style.right = '';
      cardToc.style.bottom = '';
      cardToc.style.width = '';
      cardToc.style.position = '';
      cardToc.style.zIndex = '';
      cardToc.style.transform = '';
    }
    teardownPostTagPanel();
  }

  /* ===== 文章页标签筛选侧栏 ===== */
  var postTagFilterState = {
    selected: [],
    posts: [],
    bound: false
  };

  function loadPostTagIndex() {
    var el = document.getElementById('post-tag-index-data');
    if (!el) return null;
    try {
      return JSON.parse(el.textContent);
    } catch (err) {
      return null;
    }
  }

  function normalizeTagName(name) {
    return String(name || '').trim();
  }

  function filterPostsByAllTags(posts, tagNames) {
    if (!tagNames.length) return [];
    return posts.filter(function (post) {
      var names = post.tags || [];
      return tagNames.every(function (tag) {
        return names.indexOf(tag) !== -1;
      });
    });
  }

  function syncPostTagChipActiveState() {
    document.querySelectorAll('.js-post-tag-filter').forEach(function (el) {
      var name = normalizeTagName(el.getAttribute('data-tag-name'));
      el.classList.toggle('is-active', postTagFilterState.selected.indexOf(name) !== -1);
    });
  }

  function repositionPostTagPanel() {
    var panel = document.getElementById('post-tag-panel');
    var portal = document.getElementById('post-toc-portal');
    var tocAside = document.getElementById('post-toc-aside');
    if (!panel) return;

    if (window.innerWidth < POST_TOC_BREAKPOINT && tocAside) {
      if (panel.parentElement !== tocAside) {
        tocAside.insertBefore(panel, tocAside.firstChild);
      }
    } else if (portal && panel.parentElement !== portal) {
      portal.appendChild(panel);
    }
  }

  function renderPostTagPanel() {
    var panel = document.getElementById('post-tag-panel');
    if (!panel) return;

    repositionPostTagPanel();

    var selected = postTagFilterState.selected;
    if (!selected.length) {
      panel.classList.remove('is-open');
      document.body.classList.remove('post-tag-panel-open');
      schedulePostTocPosition();
      return;
    }

    panel.classList.add('is-open');
    document.body.classList.add('post-tag-panel-open');

    var matched = filterPostsByAllTags(postTagFilterState.posts, selected);
    var pillsHtml = selected.map(function (tag) {
      return '<button type="button" class="post-tag-panel__pill js-post-tag-panel-remove" data-tag-name="' +
        escapeHtml(tag) + '">#' + escapeHtml(tag) + ' <i class="fas fa-times" aria-hidden="true"></i></button>';
    }).join('');

    var listHtml;
    if (!matched.length) {
      listHtml = '<p class="post-tag-panel__empty">没有同时包含所选标签的文章。</p>';
    } else {
      listHtml = '<ul class="post-tag-panel__list">' + matched.map(function (post) {
        return '<li class="post-tag-panel__item"><a class="post-tag-panel__link" href="' +
          resolveSiteUrl(post.path) + '">' + escapeHtml(post.title) + '</a></li>';
      }).join('') + '</ul>';
    }

    panel.innerHTML =
      '<div class="post-tag-panel__head">' +
      '<h2 class="post-tag-panel__title">标签筛选</h2>' +
      '<p class="post-tag-panel__hint">可多选，显示同时包含全部所选标签的文章</p>' +
      '<div class="post-tag-panel__active">' + pillsHtml + '</div></div>' +
      '<p class="post-tag-panel__count">共 ' + matched.length + ' 篇</p>' +
      listHtml;

    syncPostTagChipActiveState();
    schedulePostTocPosition();
    requestAnimationFrame(function () {
      syncPostTagPanelPosition();
    });
  }

  function togglePostTagFilter(tagName) {
    tagName = normalizeTagName(tagName);
    if (!tagName) return;

    var idx = postTagFilterState.selected.indexOf(tagName);
    if (idx === -1) {
      postTagFilterState.selected.push(tagName);
    } else {
      postTagFilterState.selected.splice(idx, 1);
    }

    syncPostTagChipActiveState();
    renderPostTagPanel();
  }

  function enhancePostBodyTagLinks() {
    var scope = document.getElementById('post');
    if (!scope) return;

    scope.querySelectorAll('.post-meta__tags a, .tag_share a').forEach(function (link) {
      if (link.classList.contains('js-post-tag-filter')) return;

      var name = normalizeTagName(link.textContent.replace(/^#/, ''));
      if (!name) return;

      link.classList.add('js-post-tag-filter');
      link.setAttribute('data-tag-name', name);
      link.setAttribute('href', '#');
      link.setAttribute('role', 'button');
    });
  }

  function bindPostTagFilterEvents() {
    if (postTagFilterState.bound) return;
    postTagFilterState.bound = true;

    document.addEventListener('click', function (e) {
      if (!isPostPage()) return;

      var removeBtn = e.target.closest('.js-post-tag-panel-remove');
      if (removeBtn) {
        e.preventDefault();
        togglePostTagFilter(removeBtn.getAttribute('data-tag-name'));
        return;
      }

      var tagBtn = e.target.closest('.js-post-tag-filter');
      if (!tagBtn) return;

      e.preventDefault();
      togglePostTagFilter(tagBtn.getAttribute('data-tag-name'));
    });
  }

  function syncPostTagPanelPosition() {
    var panel = document.getElementById('post-tag-panel');
    var cardToc = document.getElementById('card-toc');
    if (!panel || !cardToc || !panel.classList.contains('is-open')) {
      if (panel) {
        panel.style.top = '';
        panel.style.left = '';
        panel.style.width = '';
        panel.style.maxHeight = '';
        panel.style.position = '';
        panel.style.zIndex = '';
      }
      if (cardToc) cardToc.style.maxHeight = '';
      return;
    }

    if (window.innerWidth < POST_TOC_BREAKPOINT) {
      panel.style.position = '';
      panel.style.top = '';
      panel.style.left = '';
      panel.style.width = '';
      panel.style.maxHeight = '';
      panel.style.zIndex = '';
      cardToc.style.maxHeight = '';
      return;
    }

    var gap = 20;
    var left = cardToc.style.left || '';
    var tocTop = parseFloat(cardToc.style.top);
    if (isNaN(tocTop)) {
      tocTop = cardToc.getBoundingClientRect().top;
    }

    // 先测量标签面板高度，再限制目录高度，避免两者重叠
    panel.style.visibility = 'hidden';
    panel.style.position = 'fixed';
    panel.style.left = left;
    panel.style.width = POST_TOC_WIDTH + 'px';
    panel.style.top = '-9999px';
    panel.style.maxHeight = '';

    var panelHeight = panel.offsetHeight || 180;
    var viewportBottom = window.innerHeight - 16;
    var available = viewportBottom - tocTop;
    var tagSpace = panelHeight + gap;
    var tocMaxH = Math.max(120, available - tagSpace);

    cardToc.style.maxHeight = tocMaxH + 'px';

    var tocHeight = cardToc.offsetHeight;
    var top = tocTop + tocHeight + gap;
    var maxH = Math.max(120, viewportBottom - top);

    panel.style.visibility = '';
    panel.style.position = 'fixed';
    panel.style.left = left;
    panel.style.width = POST_TOC_WIDTH + 'px';
    panel.style.top = top + 'px';
    panel.style.maxHeight = maxH + 'px';
    panel.style.zIndex = '44';
  }

  function teardownPostTagPanel() {
    postTagFilterState.selected = [];
    postTagFilterState.posts = [];
    var panel = document.getElementById('post-tag-panel');
    if (panel) panel.remove();
    document.body.classList.remove('post-tag-panel-open');
    document.querySelectorAll('.js-post-tag-filter.is-active').forEach(function (el) {
      el.classList.remove('is-active');
    });
  }

  function initPostTagPanel() {
    if (!isPostPage()) {
      teardownPostTagPanel();
      return;
    }

    postTagFilterState.selected = [];

    var data = loadPostTagIndex();
    if (!data || !data.posts) return;

    postTagFilterState.posts = data.posts;
    bindPostTagFilterEvents();
    enhancePostBodyTagLinks();

    var portal = document.getElementById('post-toc-portal');
    var bodyWrap = document.getElementById('body-wrap');
    if (!portal && bodyWrap) {
      portal = document.createElement('div');
      portal.id = 'post-toc-portal';
      portal.className = 'post-toc-portal';
      bodyWrap.appendChild(portal);
    }
    if (!portal) return;

    var panel = document.getElementById('post-tag-panel');
    if (!panel) {
      panel = document.createElement('aside');
      panel.id = 'post-tag-panel';
      panel.className = 'post-tag-panel';
      panel.setAttribute('aria-label', '按标签筛选文章');
      portal.appendChild(panel);
    }

    if (postTagFilterState.selected.length) {
      syncPostTagChipActiveState();
      renderPostTagPanel();
    }
  }

  function syncPostTocPosition() {
    var cardToc = document.getElementById('card-toc');
    var layout = getPostTocLayout();
    var tocAside = document.getElementById('post-toc-aside');
    var portal = document.getElementById('post-toc-portal');
    if (!cardToc || !layout || !tocAside) return;

    if (window.innerWidth < POST_TOC_BREAKPOINT) {
      if (portal && cardToc.parentElement !== tocAside) {
        tocAside.appendChild(cardToc);
      }
      cardToc.style.top = '';
      cardToc.style.left = '';
      cardToc.style.right = '';
      cardToc.style.bottom = '';
      cardToc.style.width = '';
      cardToc.style.position = '';
      cardToc.style.zIndex = '';
      cardToc.style.transform = '';
      syncPostTagPanelPosition();
      return;
    }

    if (portal && cardToc.parentElement !== portal) {
      portal.appendChild(cardToc);
    }

    var layoutRect = layout.getBoundingClientRect();
    var navH = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--nav-height') || '60',
      10
    );
    var stickyTop = navH + 20;
    var post = document.getElementById('post');
    var top = stickyTop;

    if (post) {
      // 初始：目录顶与 #post 顶（封面图上缘）对齐；向下滚动后固定在导航栏下方
      top = Math.max(stickyTop, post.getBoundingClientRect().top);
    }

    var left = layoutRect.right - POST_TOC_WIDTH;
    var maxLeft = window.innerWidth - POST_TOC_WIDTH - 16;
    left = Math.max(16, Math.min(left, maxLeft));

    cardToc.style.position = 'fixed';
    cardToc.style.top = top + 'px';
    cardToc.style.left = left + 'px';
    cardToc.style.right = 'auto';
    cardToc.style.bottom = 'auto';
    cardToc.style.width = POST_TOC_WIDTH + 'px';
    cardToc.style.zIndex = '45';
    cardToc.style.transform = 'none';

    if (!document.getElementById('post-tag-panel') ||
        !document.getElementById('post-tag-panel').classList.contains('is-open')) {
      cardToc.style.maxHeight = '';
    }

    syncPostTagPanelPosition();
  }

  function schedulePostTocPosition() {
    if (postTocPositionRaf) return;
    postTocPositionRaf = requestAnimationFrame(function () {
      postTocPositionRaf = null;
      syncPostTocPosition();
    });
  }

  function bindPostTocPositionEvents() {
    if (window.__postTocPositionBound) return;
    window.__postTocPositionBound = true;
    window.addEventListener('resize', schedulePostTocPosition);
    window.addEventListener('scroll', schedulePostTocPosition, { passive: true });
  }

  function initPostTocAside() {
    var layout = document.querySelector('#body-wrap > .layout, main#content-inner.layout, main.layout, .layout');
    var bodyWrap = document.getElementById('body-wrap');
    if (!layout || !bodyWrap) return;

    if (!isPostPage()) {
      layout.classList.remove('has-post-toc');
      document.body.classList.remove('post-page-toc-right');
      teardownPostToc();
      return;
    }

    var cardToc = document.getElementById('card-toc');
    if (!cardToc) {
      layout.classList.remove('has-post-toc');
      document.body.classList.remove('post-page-toc-right');
      teardownPostToc();
      return;
    }

    var asideLeft = document.getElementById('aside-content');
    if (asideLeft) asideLeft.style.display = 'none';

    var tocAside = document.getElementById('post-toc-aside');
    if (!tocAside) {
      tocAside = document.createElement('aside');
      tocAside.id = 'post-toc-aside';
      tocAside.className = 'post-toc-aside';
      tocAside.setAttribute('aria-label', '文章目录占位');
      layout.appendChild(tocAside);
    }

    var portal = document.getElementById('post-toc-portal');
    if (!portal) {
      portal = document.createElement('div');
      portal.id = 'post-toc-portal';
      portal.className = 'post-toc-portal';
      portal.setAttribute('aria-hidden', 'false');
      bodyWrap.appendChild(portal);
    }

    var headline = cardToc.querySelector('.item-headline span');
    if (headline) headline.textContent = '文章目录';

    layout.classList.add('has-post-toc');
    document.body.classList.add('post-page-toc-right');
    cardToc.classList.add('post-toc-card');

    var tocContent = cardToc.querySelector('.toc-content');
    if (tocContent) {
      if (tocContent.style.display === 'none' && !tocContent.classList.contains('toc-div-class')) {
        tocContent.style.display = 'block';
      }
      if (!tocContent.classList.contains('is-expand')) {
        tocContent.classList.add('is-expand');
      }
    }

    bindPostTocPositionEvents();
    if (window.innerWidth >= POST_TOC_BREAKPOINT && cardToc.parentElement !== portal) {
      portal.appendChild(cardToc);
    } else if (window.innerWidth < POST_TOC_BREAKPOINT && cardToc.parentElement !== tocAside) {
      tocAside.appendChild(cardToc);
    }

    schedulePostTocPosition();
    setTimeout(schedulePostTocPosition, 120);
    setTimeout(schedulePostTocPosition, 400);

    var coverImg = document.querySelector('#post .post-hero__cover img');
    if (coverImg) {
      if (!coverImg.complete) {
        coverImg.addEventListener('load', schedulePostTocPosition, { once: true });
      }
      coverImg.addEventListener('error', schedulePostTocPosition, { once: true });
    }
  }

  function initDomainHubPage() {
    if (!isDomainHubPage()) return;

    var page = document.querySelector('#page');
    if (!page || page.querySelector('.domain-hub')) return;

    var data = loadDomainHubData();
    if (!data || !data.domains || !data.domains.length) return;

    var pageTitle = page.querySelector('.page-title');
    var pageContent = page.querySelector('.page-content, .md-content');
    if (pageTitle) pageTitle.style.display = 'none';
    if (pageContent) pageContent.style.display = 'none';

    var domains = data.domains.slice().sort(function (a, b) {
      return (a.order || 99) - (b.order || 99);
    });

    var tabsHtml = domains.map(function (d, i) {
      return '<button type="button" class="domain-hub-tab' + (i === 0 ? ' active' : '') + '" data-domain-slug="' +
        escapeHtml(d.slug) + '" aria-selected="' + (i === 0 ? 'true' : 'false') + '">' +
        escapeHtml(d.domain || d.title) + '</button>';
    }).join('');

    var panelsHtml = domains.map(function (d, i) {
      return '<div class="domain-hub-panel' + (i === 0 ? ' active' : '') + '" data-domain-slug="' +
        escapeHtml(d.slug) + '" role="tabpanel">' + renderDomainPanel(d) + '</div>';
    }).join('');

    var tagTrack = buildTagPillsHtml(data.tags, true);

    var wrapper = document.createElement('div');
    wrapper.className = 'domain-hub';
    wrapper.innerHTML =
      '<div class="domain-hub-hero">' +
      '<span class="domain-hub-badge">TECH STACK</span>' +
      '<h1 class="domain-hub-title">技术<span class="domain-hub-accent">栈</span></h1>' +
      '<p class="domain-hub-desc">可多选标签筛选文章 · 选择领域查看系列地图</p>' +
      '</div>' +
      '<div class="domain-hub-tags-wrap" aria-label="标签">' +
      '<div class="domain-hub-tags-track"><div class="domain-hub-tags-inner">' + tagTrack + '</div></div>' +
      '</div>' +
      '<div class="domain-hub-tabs" role="tablist" aria-label="领域">' + tabsHtml + '</div>' +
      '<div class="domain-hub-content">' +
      '<div class="domain-hub-panels domain-hub-view domain-hub-view--domain active">' + panelsHtml + '</div>' +
      '<div class="domain-hub-tag-view domain-hub-view domain-hub-view--tag">' +
      '<header class="domain-hub-tag-view-head">' +
      '<h2 class="domain-hub-tag-view-title">标签筛选</h2>' +
      '<p class="domain-hub-tag-view-hint">显示同时包含以下全部所选标签的文章</p>' +
      '<div class="domain-hub-tag-view-active"></div>' +
      '<p class="domain-hub-tag-view-count"></p>' +
      '</header>' +
      '<div class="domain-hub-tag-view-body"></div>' +
      '</div></div>';

    page.insertBefore(wrapper, page.firstChild);

    bindDomainHubTagsWheel(page.querySelector('.domain-hub-tags-wrap'));
    bindDomainHubTagsMarquee(page.querySelector('.domain-hub-tags-wrap'));

    var posts = data.posts || [];
    var allTags = data.tags || [];
    var tagsWrap = page.querySelector('.domain-hub-tags-wrap');
    var tagView = page.querySelector('.domain-hub-tag-view');
    var tagViewActive = page.querySelector('.domain-hub-tag-view-active');
    var tagViewCount = page.querySelector('.domain-hub-tag-view-count');
    var tagViewBody = page.querySelector('.domain-hub-tag-view-body');
    var domainView = page.querySelector('.domain-hub-view--domain');
    var selectedTags = [];

    function renderSelectedTagsBar() {
      if (!tagViewActive) return;
      if (!selectedTags.length) {
        tagViewActive.innerHTML = '';
        return;
      }
      tagViewActive.innerHTML = selectedTags.map(function (tag) {
        return '<button type="button" class="domain-hub-tag-pill domain-hub-tag-pill--selected active" data-tag-name="' +
          escapeHtml(tag) + '">#' + escapeHtml(tag) + ' <i class="fas fa-times" aria-hidden="true"></i></button>';
      }).join('');
    }

    function showDomainView() {
      selectedTags = [];
      domainView.classList.add('active');
      tagView.classList.remove('active');
      rebuildDomainHubTags(tagsWrap, allTags, false);
      syncDomainHubTagPills(page, selectedTags);
      renderSelectedTagsBar();
    }

    function updateTagView() {
      if (!selectedTags.length) {
        showDomainView();
        return;
      }

      rebuildDomainHubTags(tagsWrap, allTags, true);
      syncDomainHubTagPills(page, selectedTags);

      var matched = filterHubPostsByAllTags(posts, selectedTags);
      domainView.classList.remove('active');
      tagView.classList.add('active');
      page.querySelectorAll('.domain-hub-tab').forEach(function (tab) {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
      });

      renderSelectedTagsBar();
      tagViewCount.textContent = '共 ' + matched.length + ' 篇文章';
      tagViewBody.innerHTML = renderTagPostsHtml(matched, selectedTags.join(' + '));
    }

    function toggleDomainHubTag(tagName) {
      tagName = String(tagName || '').trim();
      if (!tagName) return;

      var idx = selectedTags.indexOf(tagName);
      if (idx === -1) {
        selectedTags.push(tagName);
      } else {
        selectedTags.splice(idx, 1);
      }

      if (!selectedTags.length) {
        var firstTab = page.querySelector('.domain-hub-tab');
        if (firstTab) selectDomain(firstTab.getAttribute('data-domain-slug'));
        return;
      }

      updateTagView();
      tagView.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function selectDomain(slug) {
      showDomainView();
      page.querySelectorAll('.domain-hub-tab').forEach(function (tab) {
        var active = tab.getAttribute('data-domain-slug') === slug;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      page.querySelectorAll('.domain-hub-panel').forEach(function (panel) {
        panel.classList.toggle('active', panel.getAttribute('data-domain-slug') === slug);
      });
    }

    page.querySelectorAll('.domain-hub-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        selectDomain(tab.getAttribute('data-domain-slug'));
      });
    });

    if (tagsWrap && !tagsWrap.dataset.tagClickBound) {
      tagsWrap.dataset.tagClickBound = '1';
      tagsWrap.addEventListener('click', function (e) {
        var pill = e.target.closest('.domain-hub-tag-pill');
        if (!pill) return;
        toggleDomainHubTag(pill.getAttribute('data-tag-name'));
      });
    }

    if (tagView && !tagView.dataset.tagClickBound) {
      tagView.dataset.tagClickBound = '1';
      tagView.addEventListener('click', function (e) {
        var pill = e.target.closest('.domain-hub-tag-pill--selected');
        if (!pill) return;
        toggleDomainHubTag(pill.getAttribute('data-tag-name'));
      });
    }

    page.querySelectorAll('.domain-hub-panel-body a[href]').forEach(function (link) {
      var href = link.getAttribute('href');
      if (href) link.setAttribute('href', resolveSiteUrl(href));
    });
  }

  /* ===== 邮箱 / GitHub 等外链跳转确认 ===== */
  var BLOG_CONTACT_EMAIL = 'moningblog@gmail.com';
  var BLOG_GITHUB_URL = 'https://github.com/caizhimoning';

  function extractMailtoAddress(href) {
    if (!href) return '';
    var match = String(href).match(/mailto:([^?#'"\s]+)/i);
    if (match) return decodeURIComponent(match[1]);
    if (href.indexOf('moningblog@gmail.com') !== -1) return BLOG_CONTACT_EMAIL;
    return '';
  }

  function normalizeGithubUrl(href) {
    if (!href) return BLOG_GITHUB_URL;
    var raw = String(href);
    if (/^https?:\/\//i.test(raw) && raw.indexOf('github.com') !== -1) {
      return raw.replace(/\/$/, '');
    }
    var match = raw.match(/github\.com\/[A-Za-z0-9_-]+/i);
    if (match) return 'https://' + match[0];
    return BLOG_GITHUB_URL;
  }

  function isEnvelopeSocialLink(link) {
    return !!link.querySelector('.fa-envelope, .fas.fa-envelope, .far.fa-envelope');
  }

  function isGithubSocialLink(link) {
    return !!link.querySelector('.fa-github, .fab.fa-github');
  }

  function ensureLinkConfirmDialog() {
    var dialog = document.getElementById('link-confirm-dialog') ||
      document.getElementById('mailto-confirm-dialog');
    if (dialog) return dialog;

    dialog = document.createElement('div');
    dialog.id = 'link-confirm-dialog';
    dialog.className = 'mailto-confirm';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'link-confirm-title');
    dialog.hidden = true;
    dialog.innerHTML =
      '<div class="mailto-confirm__backdrop" data-link-confirm-close></div>' +
      '<div class="mailto-confirm__panel">' +
      '<h3 id="link-confirm-title" class="mailto-confirm__title"></h3>' +
      '<p class="mailto-confirm__text"></p>' +
      '<p class="mailto-confirm__email mailto-confirm__detail"></p>' +
      '<p class="mailto-confirm__hint">是否继续跳转？</p>' +
      '<div class="mailto-confirm__actions">' +
      '<button type="button" class="mailto-confirm__btn mailto-confirm__btn--cancel" data-link-confirm-close>取消</button>' +
      '<button type="button" class="mailto-confirm__btn mailto-confirm__btn--ok">继续跳转</button>' +
      '</div></div>';
    document.body.appendChild(dialog);

    if (!dialog.dataset.bound) {
      dialog.dataset.bound = '1';
      dialog.querySelector('.mailto-confirm__backdrop').addEventListener('click', closeLinkConfirm);
      dialog.querySelector('.mailto-confirm__btn--cancel').addEventListener('click', closeLinkConfirm);
      dialog.querySelector('.mailto-confirm__btn--ok').addEventListener('click', function () {
        var action = dialog.dataset.pendingAction;
        var value = dialog.dataset.pendingValue;
        closeLinkConfirm();
        if (!value) return;
        if (action === 'mailto') {
          window.location.href = 'mailto:' + value;
        } else if (action === 'url') {
          window.open(value, '_blank', 'noopener,noreferrer');
        }
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !dialog.hidden) closeLinkConfirm();
      });
    }
    return dialog;
  }

  function openLinkConfirm(opts) {
    var dialog = ensureLinkConfirmDialog();
    dialog.dataset.pendingAction = opts.action;
    dialog.dataset.pendingValue = opts.value;
    dialog.querySelector('.mailto-confirm__title').textContent = opts.title;
    dialog.querySelector('.mailto-confirm__text').textContent = opts.text;
    dialog.querySelector('.mailto-confirm__detail').textContent = opts.detail;
    dialog.hidden = false;
    document.body.classList.add('mailto-confirm-open');
    dialog.querySelector('.mailto-confirm__btn--ok').focus();
  }

  function closeLinkConfirm() {
    var dialog = document.getElementById('link-confirm-dialog');
    if (!dialog) return;
    dialog.hidden = true;
    document.body.classList.remove('mailto-confirm-open');
    delete dialog.dataset.pendingAction;
    delete dialog.dataset.pendingValue;
  }

  function bindLinkConfirm(link, config) {
    if (link.dataset.linkConfirmBound === '1') return;
    link.dataset.linkConfirmBound = '1';
    link.dataset.linkConfirmType = config.type;
    link.dataset.linkConfirmValue = config.value;
    link.setAttribute('href', '#');
    link.removeAttribute('target');
    link.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openLinkConfirm({
        action: link.dataset.linkConfirmType,
        value: link.dataset.linkConfirmValue,
        title: config.title,
        text: config.text,
        detail: config.detail
      });
    });
  }

  function initSocialLinkConfirm() {
    ensureLinkConfirmDialog();

    document.querySelectorAll('a[href]').forEach(function (link) {
      if (link.dataset.linkConfirmBound === '1') return;

      var href = link.getAttribute('href') || '';
      var email = extractMailtoAddress(href);
      if (!email && isEnvelopeSocialLink(link)) {
        email = BLOG_CONTACT_EMAIL;
      }
      if (email) {
        bindLinkConfirm(link, {
          type: 'mailto',
          value: email,
          title: '打开邮件应用',
          text: '接下来将跳转到系统邮件客户端，向以下地址撰写邮件：',
          detail: email
        });
        return;
      }

      var isGithub = isGithubSocialLink(link) ||
        (href.indexOf('github.com') !== -1 && href.indexOf('caizhimoning') !== -1);
      if (isGithub) {
        var githubUrl = normalizeGithubUrl(href);
        bindLinkConfirm(link, {
          type: 'url',
          value: githubUrl,
          title: '访问 GitHub',
          text: '接下来将在新标签页打开 GitHub 主页：',
          detail: githubUrl
        });
      }
    });
  }

  function init() {
    initPostTocAside();
    initSocialLinkConfirm();
    preloadSceneBackgrounds();
    initScrollProgress();
    initShowcase();
    wrapSections();
    removeHomePagination();
    initDomainHubPage();
    initProjectsPage();
    initPostHeader();
    initPostTagPanel();
    initArchivesPage();
    initCatDrawer();
    highlightNav();
    enhanceNavSearch();
    fixLazyImages();
    fixInternalArticleLinks();
    applyWeather();

    var savedLang = localStorage.getItem('blog-lang');
    if (savedLang === 'en') toggleLanguage();
  }

  function boot() {
    init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  document.addEventListener('pjax:complete', function () {
    initPostTocAside();
    initSocialLinkConfirm();
    initProjectsPage();
    initPostHeader();
    initPostTagPanel();
    initArchivesPage();
    initDomainHubPage();
    fixInternalArticleLinks();
    highlightNav();
    syncRainReadingMode();
  });
})();
