// ==============================================================================
// 1. CONFIGURACIÓN DEL CANVAS Y CENTRO DE PANTALLA
// ==============================================================================
const canvas = document.getElementById('lienzo3D');
const ctx = canvas.getContext('2d');
const CENTRO_X = canvas.width / 2;
const CENTRO_Y = canvas.height / 2;

// ==============================================================================
// 2. TEMAS 3.1 & 3.2: GEOMETRÍA TRIDIMENSIONAL (MODELO LOCAL DE CUBO 3D)
// ==============================================================================
// Definición de los 8 vértices del cubo centrado en el origen (0,0,0)
// --- NUEVO MODELO: OCTAEDRO (6 vértices, 12 aristas) ---
const modeloOctaedroLocal = [
    { x:    0, y:  100, z:    0 }, // Vértice 0: Superior
    { x:    0, y: -100, z:    0 }, // Vértice 1: Inferior
    { x:  100, y:    0, z:    0 }, // Vértice 2: Derecha
    { x: -100, y:    0, z:    0 }, // Vértice 3: Izquierda
    { x:    0, y:    0, z:  100 }, // Vértice 4: Frente
    { x:    0, y:    0, z: -100 }  // Vértice 5: Atrás
];

const aristasOctaedro = [
    // Conexiones desde el vértice superior (0)
    [0, 2], [0, 3], [0, 4], [0, 5],
    // Conexiones desde el vértice inferior (1)
    [1, 2], [1, 3], [1, 4], [1, 5],
    // Conexiones del ecuador (cinturón central)
    [2, 4], [4, 3], [3, 5], [5, 2]
];
// ==============================================================================
// 3. TEMA 3.3: PIPELINE DE TRANSFORMACIONES TRIDIMENSIONALES
// ==============================================================================
function transformarVertice3D(v, params) {
    let { tx, ty, tz, sx, sy, sz, rx, ry, rz, shxy, shxz } = params;

    // Convertir ángulos a radianes
    let radX = rx * Math.PI / 180;
    let radY = ry * Math.PI / 180;
    let radZ = rz * Math.PI / 180;

    // --- 3.3.2 ESCALAMIENTO (S) ---
    let x1 = v.x * sx;
    let y1 = v.y * sy;
    let z1 = v.z * sz;

    // --- 3.3.4 SESGADO / SHEAR (Sh) ---
    let x2 = x1 + (shxy * y1) + (shxz * z1);
    let y2 = y1;
    let z2 = z1;

    // --- 3.3.3 ROTACIÓN EN EJE X (Pitch) ---
    let x3 = x2;
    let y3 = y2 * Math.cos(radX) - z2 * Math.sin(radX);
    let z3 = y2 * Math.sin(radX) + z2 * Math.cos(radX);

    // --- 3.3.3 ROTACIÓN EN EJE Y (Yaw) ---
    let x4 = x3 * Math.cos(radY) + z3 * Math.sin(radY);
    let y4 = y3;
    let z4 = -x3 * Math.sin(radY) + z3 * Math.cos(radY);

    // --- 3.3.3 ROTACIÓN EN EJE Z (Roll) ---
    let x5 = x4 * Math.cos(radZ) - y4 * Math.sin(radZ);
    let y5 = x4 * Math.sin(radZ) + y4 * Math.cos(radZ);
    let z5 = z4;

    // --- 3.3.1 TRASLACIÓN (T) ---
    let xFinal = x5 + tx;
    let yFinal = y5 + ty;
    let zFinal = z5 + tz;

    return { x: xFinal, y: yFinal, z: zFinal };
}

// ==============================================================================
// 4. TEMA 3.1: PROYECCIÓN PERSPECTIVA (3D A PANTALLA 2D)
// ==============================================================================
function proyectar3Da2D(v3d) {
    const distanciaCamara = 500;
    
    let zAjustado = v3d.z + distanciaCamara;
    if (zAjustado < 1) zAjustado = 1;

    // Factor de escala por perspectiva (división entre Z)
    let factorProyeccion = distanciaCamara / zAjustado;

    // Mapeo a píxeles en el lienzo
    let x2d = CENTRO_X + (v3d.x * factorProyeccion);
    let y2d = CENTRO_Y - (v3d.y * factorProyeccion); // Inversión en eje Y

    return { x: x2d, y: y2d };
}

// ==============================================================================
// 5. BUCLE DE RENDERIZADO EN TIEMPO REAL Y AUTO-ROTACIÓN
// ==============================================================================
let autoRotacionActiva = false;
let anguloRyAuto = 0;
let animacionFrameId = null;

function renderizar() {
    // 1. Si la auto-rotación está activa, incrementamos el ángulo automáticamente
    if (autoRotacionActiva) {
        anguloRyAuto = (anguloRyAuto + 1) % 360; // Gira de 0 a 360 de forma continua
        document.getElementById('ry').value = anguloRyAuto; // Actualiza el slider visualmente
    }

    // 2. Obtener parámetros actualizados del panel (incluyendo el ry modificado si rota)
    const params = {
        tx: parseFloat(document.getElementById('tx').value),
        ty: parseFloat(document.getElementById('ty').value),
        tz: parseFloat(document.getElementById('tz').value),
        sx: parseFloat(document.getElementById('sx').value),
        sy: parseFloat(document.getElementById('sy').value),
        sz: parseFloat(document.getElementById('sz').value),
        rx: parseFloat(document.getElementById('rx').value),
        ry: parseFloat(document.getElementById('ry').value), // Lee el valor (manual o automático)
        rz: parseFloat(document.getElementById('rz').value),
        shxy: parseFloat(document.getElementById('shxy').value),
        shxz: parseFloat(document.getElementById('shxz').value)
    };

    // 3. Actualizar indicadores numéricos en pantalla
    document.getElementById('valTx').innerText = params.tx;
    document.getElementById('valTy').innerText = params.ty;
    document.getElementById('valTz').innerText = params.tz;
    document.getElementById('valSx').innerText = params.sx.toFixed(1);
    document.getElementById('valSy').innerText = params.sy.toFixed(1);
    document.getElementById('valSz').innerText = params.sz.toFixed(1);
    document.getElementById('valRx').innerText = params.rx + '°';
    document.getElementById('valRy').innerText = params.ry + '°';
    document.getElementById('valRz').innerText = params.rz + '°';
    document.getElementById('valShXY').innerText = params.shxy.toFixed(1);
    document.getElementById('valShXZ').innerText = params.shxz.toFixed(1);

    // 4. Limpiar lienzo
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 5. Dibujar ejes cartesianos de guía
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(CENTRO_X, 0); ctx.lineTo(CENTRO_X, canvas.height);
    ctx.moveTo(0, CENTRO_Y); ctx.lineTo(canvas.width, CENTRO_Y);
    ctx.stroke();

    // 6. Aplicar transformaciones 3D (Usando el modeloOctaedroLocal)
    let verticesTransformados = modeloOctaedroLocal.map(v => transformarVertice3D(v, params));

    // 7. Proyectar a coordenadas 2D
    let vertices2D = verticesTransformados.map(proyectar3Da2D);

    // 8. Renderizar aristas 
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    for (let arista of aristasOctaedro) {
        let p1 = vertices2D[arista[0]];
        let p2 = vertices2D[arista[1]];
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    }

    // 9. Renderizar vértices
    ctx.fillStyle = '#f43f5e';
    for (let p of vertices2D) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // 10. Si la auto-rotación está activa, mantenemos el ciclo de animación vivo infinitamente
    if (autoRotacionActiva) {
        animacionFrameId = requestAnimationFrame(renderizar);
    }
}

// Control del Botón de Auto-Rotación (Reto)
const btnAuto = document.getElementById('btnAutoRotacion');
btnAuto.addEventListener('click', () => {
    autoRotacionActiva = !autoRotacionActiva;

    if (autoRotacionActiva) {
        btnAuto.innerText = "Detener Auto-Rotación";
        btnAuto.classList.add('activo');
        // Sincronizamos el ángulo inicial con el valor que tenga el slider en ese momento
        anguloRyAuto = parseFloat(document.getElementById('ry').value);
        renderizar(); // Arranca el motor del bucle
    } else {
        btnAuto.innerText = "Activar Auto-Rotación (Eje Y)";
        btnAuto.classList.remove('activo');
        if (animacionFrameId) {
            cancelAnimationFrame(animacionFrameId); // Detiene la animación de forma limpia
        }
    }
});

// Escuchar cambios manuales en los deslizadores
document.querySelectorAll('input[type=range]').forEach(input => {
    input.addEventListener('input', () => {
        // Si mueven el slider de Ry manualmente y está activo, sincronizamos la variable de ángulo
        if (input.id === 'ry' && autoRotacionActiva) {
            anguloRyAuto = parseFloat(input.value);
        }
        // Si no hay auto-rotación corriendo por requestAnimationFrame, renderizamos el cambio manual
        if (!autoRotacionActiva) {
            renderizar();
        }
    });
});

// Ejecución inicial estática al cargar la página
renderizar();