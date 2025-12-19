
export const es = {
  common: {
    loading: "Generando Código...",
    error: "Fallo de Construcción",
    save: "Guardar Proyecto",
    delete: "Eliminar",
    send: "Enviar",
    search: "Buscar proyectos...",
    import: "Importar Chat",
    export: "Exportar Chat",
    cancel: "Cancelar",
    confirm: "Confirmar",
    dependencies: {
      loading: "Vinculando Módulos...",
      error: "Error de Dependencias",
      resolve: "Resolviendo Dependencias..."
    },
    editor: {
      quickFix: "Solución Rápida Disponible"
    }
  },
  auth: {
      welcomeBack: "Bienvenido de nuevo",
      createAccount: "Crear Cuenta",
      verifyEmail: "Verificar Correo",
      recoverPass: "Recuperar Contraseña",
      setNewPass: "Nueva Contraseña",
      enterDetails: "Ingresa tus datos para continuar.",
      fullName: "Nombre Completo",
      firstName: "Nombres",
      lastName: "Apellidos",
      email: "Correo Electrónico",
      password: "Contraseña",
      newPassword: "Nueva Contraseña",
      forgotPass: "¿Olvidaste tu contraseña?",
      signIn: "Iniciar Sesión",
      signUp: "Registrarse",
      sendCode: "Enviar Código de Verificación",
      verify: "Verificar y Continuar",
      verificationCode: "Código de Verificación",
      createOne: "Crear una",
      myProfile: "Mi Perfil"
  },
  nav: {
    journal: "Constructor",
    memories: "Proyectos",
    graph: "Mapa",
    chat: "Asistente",
    settings: "Config",
    profile: "Perfil",
    logout: "Cerrar Sesión"
  },
  builder: {
    prompt: "¿Qué app quieres construir?",
    placeholder: "Describe una app web Node.js (ej: \"Chat en tiempo real oscuro\" o \"Dashboard de criptomonedas\")...",
    mood: "Complejidad",
    analyze: "Generar App",
    importGithub: "Vincular Repo",
    importFiles: "Escanear Docs",
    voiceStart: "Dictar Specs",
    voiceStop: "Parar",
    project: "Categoría",
    attachments: "Contexto y Assets",
    envVars: "Variables de Entorno",
    publish: "Publicar",
    security: "Seguridad",
    history: "Historial de Versiones",
    preview: "Vista Previa",
    code: "Código",
    console: "Consola",
    info: "Info",
    saveCode: "Guardar Cambios",
    securityPrompt: "Prompt de Análisis de Seguridad",
    runScan: "Ejecutar Escaneo",
    repoName: "Nombre del Repositorio",
    privateRepo: "Repositorio Privado",
    publishBtn: "Subir a GitHub",
    selectModel: "Seleccionar Modelo IA",
    modeModify: "Modificar",
    modeExplain: "Explorar",
    placeholderModify: "Pídele a la app que... (Ej: 'Añade un botón de ayuda')",
    placeholderExplain: "Pregunta algo... (Ej: '¿Qué hace este botón?')",
    deletionWarningTitle: "Revisión Requerida: Eliminación de Código",
    deletionWarningDesc: "⚠️ Lumina necesita eliminar lógica existente para aplicar este cambio. Esto no es un error, pero por favor revisa y aprueba antes de continuar.",
    status: {
      saved: "Guardado Local",
      saving: "Guardando..."
    },
    proposal: {
      header: "Propuesta de Dyad",
      agent: "Agente Arquitecto",
      changes: "Cambios Propuestos",
      files: "archivos",
      apply: "Aplicar Propuesta",
      discard: "Descartar",
      applied: "Cambios Aplicados"
    },
    thinking: {
      analyzing: "Analizando tu solicitud...",
      generating: "Generando Propuesta...",
      evaluating: "Evaluando Cambios de la App...",
      details: "Detalles Técnicos"
    },
    diff: {
      actual: "Actual (Antes)",
      new: "Nuevo (Después)"
    },
    file: {
      modified: "Modificado",
      deleted: "Eliminado",
      splitReq: "Req. División",
      blockDiff: "Diff Visual",
      code: "Código",
      copy: "Copiar Contenido",
      copied: "Código copiado al portapapeles"
    },
    error: {
      aiConnection: "No se puede conectar a la IA. El editor de código sigue funcionando."
    }
  },
  assistant: {
    waiting: "Analizando estructura...",
    title: "Arquitecto",
    chatPlaceholder: "Pregunta cómo desplegar o refactorizar...",
    noMessages: "Discute la implementación técnica con la IA.",
    builderTerminal: "Terminal de Construcción",
    archPlan: "Plan Arquitectónico",
    restore: "Restaurar versión",
    listening: "Escuchando...",
    dictate: "Dictar",
    sendCommand: "Enviar Comando",
    suggestions: {
      makeGreen: "Hazlo Verde",
      addInput: "Añade un campo de texto",
      saveBtn: "Quiero un botón de guardar",
      fixLayout: "Arregla el diseño",
      darkMode: "Añade Modo Oscuro"
    }
  },
  graph: {
    nodes: "Nodos",
    pattern: "Patrones detectados"
  },
  settings: {
    title: "Preferencias",
    language: "Idioma de Interfaz",
    model: "Modelo de Código",
    github: "Integración GitHub",
    export: "Exportar Proyectos",
    token: "Token de GitHub",
    user: "Usuario",
    connect: "Conectar GitHub",
    connected: "Conectado como",
    disconnect: "Desconectar",
    general: "General",
    dataManagement: "Gestión de Datos",
    exportBackup: "Guarda una copia de seguridad de todo tu historial como archivo JSON.",
    zoom: "Nivel de Zoom",
    automation: "Automatización",
    autoApprove: "Aprobar Cambios Automáticamente",
    autoFix: "Corregir Errores Automáticamente",
    aiConfig: "Configuración IA",
    aiProviders: "Proveedores IA",
    thinkingBudget: "Presupuesto de Pensamiento",
    contextSize: "Nivel de Atención",
    attentionFast: "Rápido",
    attentionFastDesc: "Modo ahorro. Menos tokens, mayor velocidad.",
    attentionNormal: "Normal",
    attentionNormalDesc: "Análisis equilibrado para la mayoría de tareas.",
    attentionDeep: "Profundo",
    attentionDeepDesc: "Contexto máximo. Analiza todo el proyecto (Lento).",
    telemetry: "Telemetría",
    telemetryDesc: "Registra datos anónimos para mejorar el producto.",
    mcp: "Herramientas (MCP)",
    addServer: "Agregar Servidor",
    dangerZone: "Zona de Peligro",
    resetAll: "Restablecer Todo",
    resetDesc: "Esto eliminará todas tus apps, chats y configuraciones. Esta acción no se puede deshacer."
  },
  onboarding: {
    skip: "Saltar Tutorial",
    next: "Siguiente",
    finish: "Terminar",
    chatTitle: "Asistente IA",
    chatDesc: "Aquí está el chat: pídele a Lumina lo que quieres que tu aplicación haga.",
    panelTitle: "Panel de Trabajo",
    panelDesc: "Este es el panel donde puedes ver la vista previa y editar las propiedades del código de tu aplicación."
  }
};
