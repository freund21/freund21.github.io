// Todo el contenido es accesible sin JavaScript; aquí solo añadimos comportamiento.
(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const t = text => (typeof window.portfolioText === 'function' ? window.portfolioText(text) : text);

    const cabecera = document.querySelector('.cabecera');
    const secciones = [...document.querySelectorAll('main > section[id]')];
    const enlacesMenu = [...document.querySelectorAll('.menu a')];

    /* ------------------------------------------------------------------
       Menú móvil: barra inferior con los mismos enlaces del menú principal
       ------------------------------------------------------------------ */
    const menuMovil = document.createElement('nav');
    menuMovil.className = 'menu-movil';
    menuMovil.setAttribute('aria-label', 'Navegación principal');
    enlacesMenu.forEach(enlace => {
        const copia = enlace.cloneNode(true);
        copia.removeAttribute('aria-current');
        menuMovil.append(copia);
    });
    document.body.append(menuMovil);
    const enlacesTodos = [...enlacesMenu, ...menuMovil.querySelectorAll('a')];

    /* ------------------------------------------------------------------
       Cabecera que se esconde al bajar y reaparece al subir
       ------------------------------------------------------------------ */
    let ultimoScroll = window.scrollY;
    let programado = false;

    function actualizarNavegacion() {
        const limite = cabecera.getBoundingClientRect().bottom + 120;
        let activa = secciones[0];
        secciones.forEach(seccion => {
            if (seccion.getBoundingClientRect().top <= limite) activa = seccion;
        });
        enlacesTodos.forEach(enlace => {
            if (enlace.hash === `#${activa.id}`) enlace.setAttribute('aria-current', 'location');
            else enlace.removeAttribute('aria-current');
        });

        const actual = window.scrollY;
        const bajando = actual > ultimoScroll && actual > 120;
        cabecera.classList.toggle('oculta', bajando);
        ultimoScroll = actual;
        programado = false;
    }

    window.addEventListener('scroll', () => {
        if (!programado) {
            programado = true;
            requestAnimationFrame(actualizarNavegacion);
        }
    }, { passive: true });
    window.addEventListener('resize', actualizarNavegacion);
    actualizarNavegacion();

    /* ------------------------------------------------------------------
       Aparición suave de bloques al entrar en pantalla
       ------------------------------------------------------------------ */
    const bloques = document.querySelectorAll('.seccion-titulo, .proyecto, .indice, .sobre-mi-texto, .contacto-principal, .contacto-enlaces');
    if ('IntersectionObserver' in window && !reduceMotion.matches) {
        bloques.forEach(bloque => bloque.classList.add('aparece'));
        const observadorAparicion = new IntersectionObserver((entradas, observador) => {
            entradas.forEach(entrada => {
                if (!entrada.isIntersecting) return;
                entrada.target.classList.add('visible');
                observador.unobserve(entrada.target);
            });
        }, { threshold: 0.1 });
        bloques.forEach(bloque => observadorAparicion.observe(bloque));
        // Red de seguridad: si el observador no llegara a disparar, mostramos todo igualmente.
        setTimeout(() => bloques.forEach(bloque => bloque.classList.add('visible')), 2500);
    }

    /* ------------------------------------------------------------------
       Lectura progresiva: la frase de presentación se queda fija y sus
       palabras pasan de gris a negro a medida que bajas, como si alguien
       la leyera en voz alta.
       ------------------------------------------------------------------ */
    document.querySelectorAll('[data-lectura]').forEach(parrafo => {
        if (reduceMotion.matches) return;
        // Cada palabra, en su propio span, respetando los spans de acento.
        const recorrer = nodo => {
            [...nodo.childNodes].forEach(hijo => {
                if (hijo.nodeType === Node.TEXT_NODE) {
                    const trozos = hijo.nodeValue.split(/(\s+)/);
                    const fragmento = document.createDocumentFragment();
                    trozos.forEach(trozo => {
                        if (!trozo) return;
                        if (/^\s+$/.test(trozo)) { fragmento.append(trozo); return; }
                        const span = document.createElement('span');
                        span.className = 'palabra';
                        span.textContent = trozo;
                        fragmento.append(span);
                    });
                    hijo.replaceWith(fragmento);
                } else if (hijo.nodeType === Node.ELEMENT_NODE) {
                    recorrer(hijo);
                }
            });
        };
        recorrer(parrafo);
        const palabras = [...parrafo.querySelectorAll('.palabra')];
        const seccion = parrafo.closest('.declaracion') || parrafo;
        let pendiente = false;

        function leer() {
            pendiente = false;
            const rect = seccion.getBoundingClientRect();
            const recorrido = rect.height - window.innerHeight;
            // Progreso 0..1 del scroll dentro de la sección fija
            let progreso = recorrido > 0 ? -rect.top / recorrido : 1;
            progreso = Math.min(1, Math.max(0, progreso));
            // Empezamos a leer un poco después de entrar y terminamos antes de salir
            const indice = (progreso - 0.08) / 0.8 * palabras.length;
            palabras.forEach((palabra, i) => {
                palabra.classList.toggle('leida', i < indice - 1);
                palabra.classList.toggle('leyendo', i >= indice - 1 && i < indice + 1);
            });
        }
        window.addEventListener('scroll', () => {
            if (!pendiente) { pendiente = true; requestAnimationFrame(leer); }
        }, { passive: true });
        window.addEventListener('resize', leer);
        leer();
    });

    /* ------------------------------------------------------------------
       Noelia, la presentadora fija: asoma abajo a la izquierda, habla según
       la sección, saluda de vez en cuando y cuenta curiosidades al pulsarla.
       ------------------------------------------------------------------ */
    const presentadora = document.querySelector('.presentadora');
    if (!presentadora) return;

    const bocadillo = presentadora.querySelector('.bocadillo-presentadora');
    const linea = presentadora.querySelector('.presentadora-linea');
    const teleneco = presentadora.querySelector('.teleneco');
    const botonTeleneco = presentadora.querySelector('.presentadora-boton');
    const botonCerrar = presentadora.querySelector('.presentadora-cerrar');

    function ponerPose(pose) {
        if (Number(teleneco.dataset.pose) === pose) return;
        teleneco.dataset.pose = String(pose);
        if (reduceMotion.matches) return;
        teleneco.classList.remove('animando', 'flota');
        void teleneco.offsetWidth; // reinicia la animación
        teleneco.classList.add('animando');
        teleneco.addEventListener('animationend', () => {
            teleneco.classList.remove('animando');
            teleneco.classList.add('flota');
        }, { once: true });
    }
    if (!reduceMotion.matches) teleneco.classList.add('flota');

    // [texto, pose]. El texto del hero ya viene en el HTML para que exista sin JavaScript.
    const lineaHero = [linea.textContent.trim() || '¡Hola! Soy Noelia. Baja un poco y te enseño lo que he creado.', 0];
    const lineasSeccion = {
        inicio: lineaHero,
        proyectos: ['Estos son mis proyectos. Pulsa en los vídeos o entra en GitHub para ver el código.', 1],
        'sobre-mi': ['A los 40 decidí empezar de nuevo. Aquí te cuento cómo fue.', 0],
        contacto: ['Gracias por llegar hasta aquí. Si tienes una idea o una oportunidad, escríbeme.', 2]
    };
    const curiosidades = [
        'Antes de programar pasé veinte años atendiendo a personas. Eso se nota en cómo diseño.',
        'Mi stack favorito ahora mismo: Laravel con Livewire. Menos JavaScript, más resultados.',
        'VetMove es una web real y publicada. Puedes visitarla desde la sección de proyectos.',
        'NEXO lo hice en TypeScript: un juego de cartas contra una IA.',
        'Vivo en Peñíscola, pero trabajo igual de bien en remoto.',
        'Mi lema: no llegué tarde, llegué cuando lo tuve claro.'
    ];

    let lineaActual = lineaHero[0];
    let temporizadorCambio;

    // Escribe la línea en el idioma activo; en el saludo mantiene «Noelia» en negrita.
    function pintar(texto) {
        linea.textContent = t(texto);
        if (texto === lineaHero[0]) {
            linea.innerHTML = linea.textContent.replace('Noelia', '<strong>Noelia</strong>');
        }
    }
    function decir(texto, pose) {
        if (texto === lineaActual) {
            if (typeof pose === 'number') ponerPose(pose);
            return;
        }
        lineaActual = texto;
        clearTimeout(temporizadorCambio);
        const aplicar = () => {
            pintar(texto);
            bocadillo.classList.remove('cambiando');
            if (typeof pose === 'number') ponerPose(pose);
        };
        if (reduceMotion.matches) { aplicar(); return; }
        bocadillo.classList.add('cambiando');
        temporizadorCambio = setTimeout(aplicar, 240);
    }

    // Línea según sección y proyecto a la vista
    let seccionActual = 'inicio';
    let proyectoActual = null;
    let curiosidadHasta = 0; // mientras cuenta una curiosidad no la interrumpimos

    // En el hero Noelia está a la derecha; en cuanto el hero sale de pantalla camina a la izquierda.
    function colocar(derecha) {
        if (presentadora.classList.contains('derecha') === derecha) return;
        presentadora.classList.toggle('derecha', derecha);
        ponerPose(derecha ? 0 : 1);
    }
    const hero = document.getElementById('inicio');
    if (document.body.dataset.lado === 'derecha') {
        colocar(true); // páginas de proyecto: siempre a la derecha
    } else if (hero) {
        // Se calcula en cada scroll: a la derecha solo mientras quede hero a la vista.
        const colocarSegunHero = () => colocar(hero.getBoundingClientRect().bottom > window.innerHeight * 0.15);
        window.addEventListener('scroll', colocarSegunHero, { passive: true });
        window.addEventListener('resize', colocarSegunHero);
        colocarSegunHero();
    }

    function refrescar() {
        if (Date.now() < curiosidadHasta) return;
        if (seccionActual === 'proyectos' && proyectoActual) {
            decir(proyectoActual.dataset.linea, 1);
        } else if (lineasSeccion[seccionActual]) {
            decir(lineasSeccion[seccionActual][0], lineasSeccion[seccionActual][1]);
        }
    }

    if ('IntersectionObserver' in window) {
        const observadorSecciones = new IntersectionObserver(entradas => {
            entradas.forEach(entrada => {
                if (entrada.isIntersecting) seccionActual = entrada.target.id;
            });
            refrescar();
        }, { rootMargin: '-40% 0px -50% 0px' });
        secciones.forEach(seccion => observadorSecciones.observe(seccion));

        const observadorProyectos = new IntersectionObserver(entradas => {
            entradas.forEach(entrada => {
                if (entrada.isIntersecting) proyectoActual = entrada.target;
            });
            refrescar();
        }, { rootMargin: '-35% 0px -45% 0px' });
        document.querySelectorAll('.proyecto[data-linea]').forEach(p => observadorProyectos.observe(p));
    }

    // En el hero saluda y presenta de vez en cuando
    if (!reduceMotion.matches) {
        const poses = [0, 1, 2, 1];
        let paso = 0;
        setInterval(() => {
            if (seccionActual !== 'inicio' || document.hidden || Date.now() < curiosidadHasta) return;
            paso = (paso + 1) % poses.length;
            ponerPose(poses[paso]);
        }, 5000);
    }

    // Curiosidades al pulsarla
    let indiceCuriosidad = Math.floor(Math.random() * curiosidades.length);
    botonTeleneco.addEventListener('click', () => {
        indiceCuriosidad = (indiceCuriosidad + 1) % curiosidades.length;
        curiosidadHasta = Date.now() + 7000;
        decir(curiosidades[indiceCuriosidad], (Number(teleneco.dataset.pose) + 1) % 3);
        setTimeout(refrescar, 7100);
    });

    // Ocultar (se recuerda durante la sesión)
    let cerrada = false;
    try { cerrada = sessionStorage.getItem('zalezigo-presentadora') === 'cerrada'; } catch { /* sin almacenamiento */ }
    if (cerrada) presentadora.hidden = true;
    botonCerrar.addEventListener('click', () => {
        presentadora.classList.add('oculta');
        setTimeout(() => { presentadora.hidden = true; }, 350);
        try { sessionStorage.setItem('zalezigo-presentadora', 'cerrada'); } catch { /* sin almacenamiento */ }
    });

    /* ------------------------------------------------------------------
       Correo: clic para copiar, con aviso accesible
       ------------------------------------------------------------------ */
    const botonCorreo = document.querySelector('.contacto-correo');
    const aviso = document.getElementById('copiado-aviso');
    if (botonCorreo && aviso) {
        let temporizador;
        botonCorreo.addEventListener('click', async () => {
            const correo = botonCorreo.dataset.correo;
            try {
                await navigator.clipboard.writeText(correo);
                aviso.textContent = t('¡Copiado! Te leo pronto.');
                curiosidadHasta = Date.now() + 5000;
                decir('¡Copiado! Hablamos pronto.', 2);
                setTimeout(refrescar, 5100);
            } catch {
                window.location.href = `mailto:${correo}`;
                return;
            }
            clearTimeout(temporizador);
            temporizador = setTimeout(() => { aviso.textContent = ''; }, 3000);
        });
    }

    /* Si cambia el idioma, repetimos la línea actual traducida. */
    document.addEventListener('portfolio:language', () => pintar(lineaActual));
    // idiomas.js aplica el idioma guardado antes de que exista este listener: traducimos la línea inicial.
    pintar(lineaActual);
})();
