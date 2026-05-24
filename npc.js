'use strict';
/* =============================================
   NOSTAGAMES - NPC Background System
   شخصيات canvas تتحرك خلف الموقع
   ============================================= */
const NPCSystem = (() => {
    const NW=20, NH=26, SPEED=45;
    let canvas, ctx, npcs=[], lastTime=0, bubbleTimer=0;

    const PALS = [
        {body:'#c83020',hair:'#1a1a1a',skin:'#f0a060'}, // شرطي أحمر
        {body:'#2060c0',hair:'#8b4513',skin:'#f0d0b0'}, // أزرق
        {body:'#208040',hair:'#1a1a1a',skin:'#d4956a'}, // أخضر
        {body:'#806020',hair:'#2a1a0a',skin:'#f0c090'}, // بني
        {body:'#602080',hair:'#c060f0',skin:'#f0d0b0'}, // بنفسجي
        {body:'#208080',hair:'#1a1a1a',skin:'#e0b090'}, // سماوي
        {body:'#c06020',hair:'#1a1a1a',skin:'#d4956a'}, // برتقالي
        {body:'#404040',hair:'#888',   skin:'#c8a080'}, // رمادي
    ];

    // سيناريوهات كل شخصية
    const ROLES = [
        { name:'cop',     label:'👮',  state:'patrol'  },
        { name:'dancer',  label:'💃',  state:'dance'   },
        { name:'runner',  label:'🏃',  state:'run'     },
        { name:'sleeper', label:'😴',  state:'sleep'   },
        { name:'talker',  label:'💬',  state:'talk'    },
        { name:'wander1', label:'🚶',  state:'wander'  },
        { name:'wander2', label:'🚶',  state:'wander'  },
        { name:'hidden',  label:'👻',  state:'hidden'  }, // مختبئ خلف البطاقات
    ];

    const DIALOGUES = [
        'العب معنا! 🎮', 'الفلاش حي! ⚡',
        'حمّل التطبيق! 📱', 'طفولتنا عادت! 😍',
        'أسطورة! 🏆', 'العب Hobo! 👊',
        'Papa\'s أحلى! 🍕', '...zzz 😴',
        '؟؟؟ 🤔', 'أنا هنا! 👋',
    ];

    function init() {
        canvas = document.getElementById('npc-canvas');
        if (!canvas) return;
        ctx = canvas.getContext('2d');
        _resize();
        window.addEventListener('resize', _resize);

        // إنشاء الشخصيات
        npcs = ROLES.map((role, i) => _mkNPC(role, PALS[i % PALS.length]));

        requestAnimationFrame(_loop);
    }

    function _resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function _mkNPC(role, pal) {
        const x = 80 + Math.random() * (window.innerWidth  - 160);
        const y = 80 + Math.random() * (window.innerHeight - 160);
        return {
            x, y, pal, role,
            dir: ['down','up','left','right'][Math.floor(Math.random()*4)],
            frame: 0, ft: 0,
            tx: x, ty: y,
            waiting: true, wt: Math.random() * 2,
            danceT: 0, danceFrame: 0,
            sleepT: 0,
            talkT: 0, talkMsg: '',
            scale: role.state === 'run' ? 1.2 : 1,
            opacity: role.state === 'hidden' ? 0 : 0.85,
            visible: role.state !== 'hidden',
            // للشرطي: يلاحق العداء
            chaseTarget: null,
        };
    }

    function _loop(ts) {
        const delta = Math.min((ts - lastTime) / 1000, 0.05);
        lastTime = ts;
        _update(delta);
        _draw();
        requestAnimationFrame(_loop);
    }

    function _update(delta) {
        const runner = npcs.find(n => n.role.state === 'run');
        const cop    = npcs.find(n => n.role.name  === 'cop');

        for (const n of npcs) {
            if (!n.visible) continue;
            switch(n.role.state) {
                case 'wander':  _doWander(n, delta, SPEED); break;
                case 'run':     _doWander(n, delta, SPEED * 2.5); break;
                case 'patrol':  _doPatrol(n, delta, runner); break;
                case 'dance':   _doDance(n, delta); break;
                case 'sleep':   _doSleep(n, delta); break;
                case 'talk':    _doTalk(n, delta); break;
            }
        }

        // bubble timer
        bubbleTimer -= delta;
    }

    function _doWander(n, delta, spd) {
        if (n.waiting) {
            n.wt -= delta; n.frame = 0;
            if (n.wt <= 0) { _pickTarget(n); n.waiting = false; }
            return;
        }
        const dx = n.tx - n.x, dy = n.ty - n.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 4) {
            n.waiting = true;
            n.wt = 1 + Math.random() * 3;
            return;
        }
        const nx = dx/dist, ny = dy/dist;
        n.x += nx * spd * delta;
        n.y += ny * spd * delta;
        n.x = Math.max(20, Math.min(window.innerWidth  - 40, n.x));
        n.y = Math.max(20, Math.min(window.innerHeight - 40, n.y));
        n.dir = Math.abs(dx) > Math.abs(dy) ? (dx>0?'right':'left') : (dy>0?'down':'up');
        n.ft += delta; if (n.ft >= 0.15) { n.ft = 0; n.frame = (n.frame+1)%3; }
    }

    function _doPatrol(n, delta, runner) {
        // الشرطي يلاحق العداء أحياناً
        if (runner && Math.random() < 0.002) {
            n.tx = runner.x; n.ty = runner.y;
            n.waiting = false;
        }
        _doWander(n, delta, SPEED * 0.9);
    }

    function _doDance(n, delta) {
        n.danceT += delta;
        n.danceFrame = Math.floor(n.danceT * 6) % 4;
        // تحرك بسيط للجانبين
        n.x += Math.sin(n.danceT * 3) * 0.4;
    }

    function _doSleep(n, delta) {
        n.sleepT += delta;
        n.frame = 0; // ساكن
    }

    function _doTalk(n, delta) {
        n.talkT += delta;
        if (n.talkT > 4) {
            n.talkT = 0;
            n.talkMsg = DIALOGUES[Math.floor(Math.random() * DIALOGUES.length)];
            _showBubble(n.talkMsg, n.x, n.y - 40);
        }
        _doWander(n, delta, SPEED * 0.4);
    }

    function _pickTarget(n) {
        n.tx = 60 + Math.random() * (window.innerWidth  - 120);
        n.ty = 60 + Math.random() * (window.innerHeight - 120);
    }

    /* ===== DRAW ===== */
    function _draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const n of npcs) {
            if (!n.visible) continue;
            ctx.save();
            ctx.globalAlpha = n.opacity;
            _drawNPC(n);
            ctx.restore();
        }
    }

    function _drawNPC(n) {
        const {x, y, pal:p, dir, frame, role} = n;
        const s = n.scale || 1;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(s, s);
        ctx.translate(-NW/2, -NH/2);

        // ظل
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.beginPath();
        ctx.ellipse(NW/2, NH+3, 9, 3, 0, 0, Math.PI*2);
        ctx.fill();

        if (role.state === 'dance') {
            _drawDance(ctx, p, n.danceFrame);
        } else if (role.state === 'sleep') {
            _drawSleep(ctx, p, n.sleepT);
        } else {
            _drawWalk(ctx, p, dir, frame, n.waiting === false);
        }

        // لافتة الدور فوق الرأس
        ctx.font = '11px serif';
        ctx.fillText(role.label, NW/2 - 6, -4);

        ctx.restore();
    }

    function _drawWalk(ctx, p, dir, frame, moving) {
        const sw = moving ? (frame===1?3:frame===2?-3:0) : 0;
        const as = moving ? (frame===1?-3:frame===2?3:0) : 0;
        // أرجل
        ctx.fillStyle = p.body;
        ctx.fillRect(4, 18, 5, 6+sw); ctx.fillRect(11, 18, 5, 6-sw);
        ctx.fillStyle = '#111';
        ctx.fillRect(3, 23+sw, 7, 3); ctx.fillRect(10, 23-sw, 7, 3);
        // جسم
        ctx.fillStyle = p.body;
        ctx.fillRect(3, 10, 14, 10);
        // ذراعان
        ctx.fillRect(0, 11, 4, 8+as); ctx.fillRect(16, 11, 4, 8-as);
        ctx.fillStyle = p.skin;
        ctx.fillRect(0, 18+as, 4, 3); ctx.fillRect(16, 18-as, 4, 3);
        // رأس
        ctx.fillStyle = p.skin; ctx.fillRect(4, 1, 12, 11);
        ctx.fillStyle = p.hair; ctx.fillRect(4, 1, 12, 4);
        _eyes(ctx, dir, p.hair);
    }

    function _drawDance(ctx, p, frame) {
        const bounce = frame % 2 === 0 ? -2 : 0;
        const armL   = frame < 2 ? -6 : 6;
        const armR   = frame < 2 ? 6  : -6;
        ctx.fillStyle = p.body;
        ctx.fillRect(4, 18+bounce, 5, 6); ctx.fillRect(11, 18+bounce, 5, 6);
        ctx.fillStyle = '#111';
        ctx.fillRect(3, 23+bounce, 7, 3); ctx.fillRect(10, 23+bounce, 7, 3);
        ctx.fillStyle = p.body;
        ctx.fillRect(3, 10+bounce, 14, 10);
        ctx.fillRect(0, 11+armL, 4, 8); ctx.fillRect(16, 11+armR, 4, 8);
        ctx.fillStyle = p.skin;
        ctx.fillRect(0, 18+armL, 4, 3); ctx.fillRect(16, 18+armR, 4, 3);
        ctx.fillStyle = p.skin; ctx.fillRect(4, 1+bounce, 12, 11);
        ctx.fillStyle = p.hair; ctx.fillRect(4, 1+bounce, 12, 4);
        _eyes(ctx, 'down', p.hair);
    }

    function _drawSleep(ctx, p, t) {
        // جالس ورأسه ينزل
        const nod = Math.sin(t * 1.2) > 0 ? 1 : 0;
        ctx.fillStyle = p.body;
        ctx.fillRect(3, 14, 14, 10); // جسم
        ctx.fillRect(0, 14, 4, 7); ctx.fillRect(16, 14, 4, 7); // ذراعان للأمام
        ctx.fillStyle = p.skin;
        ctx.fillRect(4, 3+nod, 12, 11); // رأس يومئ
        ctx.fillStyle = p.hair; ctx.fillRect(4, 3+nod, 12, 4);
        // zZz
        ctx.fillStyle = '#aef';
        ctx.font = 'bold 7px monospace';
        ctx.fillText('z', NW+2, 8 - Math.sin(t)*4);
        ctx.fillText('Z', NW+6, 2 - Math.sin(t)*4);
    }

    function _eyes(ctx, dir, color) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(6, 5, 3, 3); ctx.fillRect(11, 5, 3, 3);
        ctx.fillStyle = color;
        const ox = dir==='right'?1:dir==='left'?0:0;
        const oy = dir==='down'?1:0;
        ctx.fillRect(6+ox, 5+oy, 2, 2); ctx.fillRect(11+ox, 5+oy, 2, 2);
    }

    /* ===== BUBBLE ===== */
    function _showBubble(text, x, y) {
        const el   = document.getElementById('npc-bubble');
        const span = document.getElementById('npc-bubble-text');
        if (!el || !span) return;
        span.textContent = text;
        el.style.left = Math.min(x, window.innerWidth - 200) + 'px';
        el.style.top  = Math.max(y - 50, 10) + 'px';
        el.classList.remove('hidden');
        clearTimeout(el._t);
        el._t = setTimeout(() => el.classList.add('hidden'), 2500);
    }

    /* ===== PUBLIC API ===== */
    // تُستدعى من main.js عند الضغط على لعبة أو زر تحميل
    function onGameClick(cardEl) {
        // الشخصية المختبئة تظهر خلف البطاقة
        const hidden = npcs.find(n => n.role.name === 'hidden');
        if (!hidden || !cardEl) return;
        const rect = cardEl.getBoundingClientRect();
        hidden.x = rect.left + rect.width/2;
        hidden.y = rect.top  + rect.height/2;
        hidden.visible = true;
        hidden.opacity = 0.9;
        hidden.role = {...hidden.role, state:'wander'};
        _showBubble('👍🏻 اختيار ممتاز!', hidden.x, hidden.y - 40);
        setTimeout(() => { hidden.visible = false; }, 4000);
    }

    function onDownloadClick() {
        const talker = npcs.find(n => n.role.state === 'talk') || npcs[0];
        _showBubble('👍🏻 قرار صحيح! حمّل الآن!', talker.x, talker.y - 60);
    }

    return { init, onGameClick, onDownloadClick };
})();
