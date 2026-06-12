'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, History, Play, Save, FileText, CheckCircle,
  GitBranch, Sliders, Search, AlertCircle, Eye, Sparkles,
  Check, ArrowRight, RefreshCw, Layers, Terminal, Info, CheckSquare
} from 'lucide-react';

type ModelSettings = {
  model: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
};

type PromptVersion = {
  id: string;
  version_number: number;
  system_prompt: string;
  user_prompt_template: string;
  model_settings: ModelSettings;
  changelog: string;
  created_by: string;
  created_at: string;
};

type Prompt = {
  id: string;
  slug: string;
  name: string;
  description: string;
  current_version_id: string;
  tags: string[];
  versions: PromptVersion[];
};

type Notification = {
  message: string;
  type: 'success' | 'error' | 'warning';
} | null;

const INITIAL_PROMPTS: Prompt[] = [
  {
    id: 'p1',
    slug: 'asistente-tareas-complejas',
    name: 'Asistente de Tareas Complejas',
    description: 'Decompone tareas de usuario complejas en un plan paso a paso y asigna subtareas.',
    current_version_id: 'v3',
    tags: ['Agentes', 'Planificación'],
    versions: [
      {
        id: 'v3',
        version_number: 3,
        system_prompt: 'Eres un Agente Planificador experto. Tu objetivo es recibir una meta compleja de un usuario y descomponerla en un plan de acción riguroso de no más de 5 pasos secuenciales. Para cada paso, debes definir:\n1. Nombre del paso\n2. Criterio de éxito\n3. Riesgo principal\nUsa un tono sumamente profesional, analítico y conciso. Evita introducciones innecesarias.',
        user_prompt_template: 'Por favor, analiza la siguiente tarea compleja: "{{meta_usuario}}".\n\nToma en cuenta las siguientes restricciones adicionales:\n- Nivel de experiencia del ejecutor: {{nivel_experiencia}}\n- Tiempo estimado límite: {{tiempo_limite}}\n\nGenera el plan estructurado en formato markdown.',
        model_settings: {
          model: 'gpt-4o',
          temperature: 0.2,
          max_tokens: 1500,
          top_p: 0.9
        },
        changelog: 'Se ajustó el System Prompt para forzar un límite estricto de 5 pasos y remover saludos cordiales que consumían tokens.',
        created_by: 'Sofia Ramirez (Lead AI)',
        created_at: '2026-06-10T14:30:00Z'
      },
      {
        id: 'v2',
        version_number: 2,
        system_prompt: 'Eres un planificador experto. Ayuda al usuario a estructurar su proyecto paso a paso de manera detallada. Sé amable.',
        user_prompt_template: 'Ayúdame con mi tarea: "{{meta_usuario}}". Mi nivel es {{nivel_experiencia}}.',
        model_settings: {
          model: 'gpt-4o-mini',
          temperature: 0.5,
          max_tokens: 1000,
          top_p: 1.0
        },
        changelog: 'Migración a GPT-4o-mini para reducir costos en un 60% e inclusión de la variable nivel de experiencia.',
        created_by: 'Tomas Blanco (SRE)',
        created_at: '2026-05-20T09:15:00Z'
      },
      {
        id: 'v1',
        version_number: 1,
        system_prompt: 'Eres un robot útil que hace listas de tareas.',
        user_prompt_template: 'Tengo que hacer esto: {{meta_usuario}}. Dime qué hacer paso a paso.',
        model_settings: {
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          max_tokens: 800,
          top_p: 1.0
        },
        changelog: 'Prompt semilla inicial de pruebas de concepto.',
        created_by: 'Tomas Blanco (SRE)',
        created_at: '2026-04-12T11:00:00Z'
      }
    ]
  },
  {
    id: 'p2',
    slug: 'onboarding-buddy',
    name: 'Onboarding Buddy',
    description: 'Guía y responde dudas de nuevos ingresos en base a las políticas de la compañía.',
    current_version_id: 'v2_2',
    tags: ['HR', 'Soporte'],
    versions: [
      {
        id: 'v2_2',
        version_number: 2,
        system_prompt: 'Eres "Buddy", el asistente virtual de Onboarding de Acme Corp. Tu personalidad es alegre, empática y proactiva.\nResponde las dudas del empleado utilizando el contexto corporativo provisto. Si no sabes la respuesta basándote estrictamente en el contexto, di cordialmente que consultarás con Talento Humano y que te pondrás en contacto.',
        user_prompt_template: 'Contexto de la empresa:\n"""\n{{contexto_empresa}}\n"""\n\nPregunta de {{nombre_empleado}}:\n"{{pregunta_usuario}}"\n\nPor favor, responde su duda de forma directa y entusiasta.',
        model_settings: {
          model: 'claude-3-5-sonnet',
          temperature: 0.4,
          max_tokens: 1200,
          top_p: 0.95
        },
        changelog: 'Se cambió el modelo base a Claude 3.5 Sonnet para mejorar drásticamente la adherencia al contexto y disminuir falsas promesas.',
        created_by: 'Camila Sosa (Product Owner)',
        created_at: '2026-06-08T18:45:00Z'
      },
      {
        id: 'v2_1',
        version_number: 1,
        system_prompt: 'Eres un bot de ayuda para empleados nuevos.',
        user_prompt_template: 'Toma esta información corporativa: {{contexto_empresa}}\nResponde a esta duda: {{pregunta_usuario}}',
        model_settings: {
          model: 'gpt-4o-mini',
          temperature: 0.0,
          max_tokens: 1000,
          top_p: 1.0
        },
        changelog: 'Primera versión estructurada de Onboarding con control de contexto corporativo.',
        created_by: 'Sofia Ramirez (Lead AI)',
        created_at: '2026-05-15T10:00:00Z'
      }
    ]
  },
  {
    id: 'p3',
    slug: 'corrector-codigo-seguro',
    name: 'Auditor de Código Seguro',
    description: 'Analiza fragmentos de código en busca de vulnerabilidades OWASP Top 10.',
    current_version_id: 'v3_1',
    tags: ['DevSecOps', 'Calidad'],
    versions: [
      {
        id: 'v3_1',
        version_number: 1,
        system_prompt: 'Eres un analista de seguridad estática de código (SAST) de nivel Staff.\nTu tarea es revisar de manera implacable el código proporcionado por el usuario en busca de vulnerabilidades de seguridad comunes (inyecciones SQL, XSS, secretos expuestos, malas configuraciones, fallos de criptografía, etc.).\nPara cada riesgo encontrado, provee:\n- Nivel de Severidad (Baja, Media, Alta, Crítica)\n- Línea/bloque sospechoso\n- Explicación de la vulnerabilidad\n- Código corregido y seguro.',
        user_prompt_template: 'Idioma/Framework: {{lenguaje}}\nCódigo a auditar:\n```\n{{codigo_fuente}}\n```\n\nGenera tu reporte detallado abajo:',
        model_settings: {
          model: 'claude-3-5-sonnet',
          temperature: 0.1,
          max_tokens: 2500,
          top_p: 1.0
        },
        changelog: 'Lanzamiento inicial del agente de seguridad estática.',
        created_by: 'Nicolas Vega (SecOps Lead)',
        created_at: '2026-06-11T08:20:00Z'
      }
    ]
  }
];

export default function PromptManagementPage() {
  const [prompts, setPrompts] = useState<Prompt[]>(INITIAL_PROMPTS);
  const [selectedPromptId, setSelectedPromptId] = useState('p1');
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'history' | 'playground'
  const [searchQuery, setSearchQuery] = useState('');

  // Form states for the prompt being edited
  const [editSystemPrompt, setEditSystemPrompt] = useState('');
  const [editUserTemplate, setEditUserTemplate] = useState('');
  const [editModel, setEditModel] = useState('gpt-4o');
  const [editTemp, setEditTemp] = useState(0.2);
  const [editMaxTokens, setEditMaxTokens] = useState(1500);
  const [editChangelog, setEditChangelog] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Selection states for version comparing
  const [diffVerA, setDiffVerA] = useState('');
  const [diffVerB, setDiffVerB] = useState('');

  // Sandbox inputs (dynamically built depending on template variables)
  const [sandboxVariables, setSandboxVariables] = useState<Record<string, string>>({});
  const [sandboxResult, setSandboxResult] = useState('');
  const [isRunningSandbox, setIsRunningSandbox] = useState(false);

  // General Notification Banner
  const [notification, setNotification] = useState<Notification>(null);

  // Get active prompt object
  const activePrompt = useMemo(() => {
    return prompts.find(p => p.id === selectedPromptId) || prompts[0];
  }, [prompts, selectedPromptId]);

  // Get the active (deployed) version of the active prompt
  const activeDeployedVersion = useMemo(() => {
    if (!activePrompt) return null;
    return activePrompt.versions.find(v => v.id === activePrompt.current_version_id) || activePrompt.versions[0];
  }, [activePrompt]);

  // Whenever the active prompt changes, synchronize editor states to the active deployed version
  useEffect(() => {
    if (activePrompt && activeDeployedVersion) {
      setEditSystemPrompt(activeDeployedVersion.system_prompt);
      setEditUserTemplate(activeDeployedVersion.user_prompt_template);
      setEditModel(activeDeployedVersion.model_settings.model);
      setEditTemp(activeDeployedVersion.model_settings.temperature);
      setEditMaxTokens(activeDeployedVersion.model_settings.max_tokens);
      setEditChangelog('');
      setEditSlug(activePrompt.slug);
      setEditName(activePrompt.name);
      setEditDesc(activePrompt.description);

      // Setup diff selectors
      if (activePrompt.versions.length >= 2) {
        setDiffVerA(activePrompt.versions[0].id);
        setDiffVerB(activePrompt.versions[1].id);
      } else if (activePrompt.versions.length === 1) {
        setDiffVerA(activePrompt.versions[0].id);
        setDiffVerB(activePrompt.versions[0].id);
      }

      // Clean sandbox output
      setSandboxResult('');
    }
  }, [selectedPromptId, activePrompt, activeDeployedVersion]);

  // Handle Notifications helper
  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Extract custom {{variables}} from the current editable user template
  const detectedVariables = useMemo(() => {
    const regex = /{{\s*([a-zA-Z0-9_-]+)\s*}}/g;
    const vars: string[] = [];
    let match;
    while ((match = regex.exec(editUserTemplate)) !== null) {
      if (!vars.includes(match[1])) {
        vars.push(match[1]);
      }
    }
    return vars;
  }, [editUserTemplate]);

  // Synchronize sandbox form state keys with detected variables
  useEffect(() => {
    const nextInputs = { ...sandboxVariables };
    let changed = false;
    detectedVariables.forEach(v => {
      if (nextInputs[v] === undefined) {
        // Prepopulate with nice dummy values based on keys
        let defVal = '';
        if (v.includes('meta') || v.includes('tarea')) defVal = 'Crear un sistema de autenticación multifactor paso a paso para React y Node.';
        else if (v.includes('experiencia')) defVal = 'Desarrollador Junior';
        else if (v.includes('tiempo')) defVal = '3 días';
        else if (v.includes('contexto')) defVal = 'Políticas Acme Corp:\n- Vacaciones: 15 días hábiles al año.\n- Seguro dental cubierto al 100%.\n- Trabajo híbrido flexible.';
        else if (v.includes('nombre')) defVal = 'Juan Pérez';
        else if (v.includes('pregunta')) defVal = '¿Cuántos días de vacaciones tengo y cómo los solicito?';
        else if (v.includes('lenguaje')) defVal = 'TypeScript/Express';
        else if (v.includes('codigo')) defVal = 'app.post("/login", (req, res) => {\n  const query = "SELECT * FROM users WHERE user = \'" + req.body.user + "\'";\n  db.query(query);\n});';

        nextInputs[v] = defVal;
        changed = true;
      }
    });
    if (changed) {
      setSandboxVariables(nextInputs);
    }
  }, [detectedVariables]);

  const handleCreateNewPrompt = () => {
    const newId = 'p_' + Date.now();
    const newSlug = 'nuevo-prompt-' + Math.floor(Math.random() * 100);
    const newPrompt = {
      id: newId,
      slug: newSlug,
      name: 'Nuevo Prompt de Tareas',
      description: 'Describe qué hace este nuevo prompt para tu equipo.',
      current_version_id: 'v_init',
      tags: ['Borrador'],
      versions: [
        {
          id: 'v_init',
          version_number: 1,
          system_prompt: 'Eres un asistente experto en...',
          user_prompt_template: 'Hola, procesa el siguiente contenido: {{mi_variable}}',
          model_settings: {
            model: 'gpt-4o-mini',
            temperature: 0.3,
            max_tokens: 1000,
            top_p: 1.0
          },
          changelog: 'Inicialización de prompt',
          created_by: 'Administrador Global',
          created_at: new Date().toISOString()
        }
      ]
    };

    setPrompts([newPrompt, ...prompts]);
    setSelectedPromptId(newId);
    setActiveTab('editor');
    showToast('¡Se ha creado un contenedor de prompt vacío!', 'success');
  };

  const handleSaveNewVersion = () => {
    if (!activePrompt) return;
    if (!editChangelog.trim()) {
      showToast('Por favor, ingresa una bitácora de cambios (Changelog) para documentar esta versión.', 'error');
      return;
    }

    const currentMaxVer = Math.max(...activePrompt.versions.map(v => v.version_number));
    const nextVerNumber = currentMaxVer + 1;
    const newVersionId = `v_new_${nextVerNumber}_${Date.now()}`;

    const newVersionObj = {
      id: newVersionId,
      version_number: nextVerNumber,
      system_prompt: editSystemPrompt,
      user_prompt_template: editUserTemplate,
      model_settings: {
        model: editModel,
        temperature: editTemp,
        max_tokens: editMaxTokens,
        top_p: 1.0
      },
      changelog: editChangelog,
      created_by: 'Admin Colaborador (Tú)',
      created_at: new Date().toISOString()
    };

    // Update state
    const updatedPrompts = prompts.map(p => {
      if (p.id === selectedPromptId) {
        return {
          ...p,
          slug: editSlug,
          name: editName,
          description: editDesc,
          versions: [newVersionObj, ...p.versions] // prepend newest
        };
      }
      return p;
    });

    setPrompts(updatedPrompts);
    setEditChangelog(''); // Clear changelog
    showToast(`¡Versión v${nextVerNumber} guardada exitosamente como borrador!`, 'success');
  };

  const handleDeployVersion = (versionId: string) => {
    const updatedPrompts = prompts.map(p => {
      if (p.id === selectedPromptId) {
        return {
          ...p,
          current_version_id: versionId
        };
      }
      return p;
    });
    setPrompts(updatedPrompts);
    const verObj = activePrompt.versions.find(v => v.id === versionId);
    if (verObj) {
      showToast(`¡Versión v${verObj.version_number} promovida a PRODUCCIÓN en caliente!`, 'warning');
    }
  };

  const runSandboxSimulation = () => {
    setIsRunningSandbox(true);
    setSandboxResult('Generando llamada al LLM con tus variables mapeadas...');

    setTimeout(() => {
      // Build simulated rendered string
      let rendered = editUserTemplate;
      Object.entries(sandboxVariables).forEach(([key, val]) => {
        rendered = rendered.split(`{{${key}}}`).join(val || `[${key}]`);
      });

      // Simple mock AI completions based on prompt content
      let aiResponse = "";
      if (editSlug.includes('asistente')) {
        aiResponse = `### 📋 PLAN DE ACCIÓN RECOMENDADO (Simulación de ${editModel})

1. **Definición de Arquitectura Tecnológica**
   - *Criterio de éxito:* Arquitectura aprobada con login MFA (TOTP) y cookies HTTPS-only seguras.
   - *Riesgo principal:* Alta complejidad en sincronía de tokens de refresco entre React y Express.

2. **Desarrollo del Backend de Autenticación (Express & Redis/JWT)**
   - *Criterio de éxito:* Endpoints \`/auth/register\`, \`/auth/login\` y \`/auth/mfa/setup\` testeados y seguros.
   - *Riesgo principal:* Vulnerabilidad de inyección SQL si las queries no son parametrizadas correctamente.

3. **Desarrollo del Frontend Segurizado (React)**
   - *Criterio de éxito:* Implementación de Contexto Global de Auth y guards de ruta reactivos.
   - *Riesgo principal:* Guardar tokens de acceso en localStorage expuestos a ataques XSS.

4. **Configuración del Segundo Factor (MFA - Google Authenticator)**
   - *Criterio de éxito:* Generación óptima de códigos QR y validación correcta de contraseñas de un solo uso (TOTP).
   - *Riesgo principal:* Desfase horario del servidor que cause rechazos de tokens válidos de forma recurrente.

*Simulación ejecutada de forma exitosa. Parámetros activos: Temp: ${editTemp}, Max Tokens: ${editMaxTokens}.*`;
      } else if (editSlug.includes('onboarding')) {
        const nombre = sandboxVariables['nombre_empleado'] || 'Empleado';
        aiResponse = `¡Hola, ${nombre}! 👋 Qué alegría saludarte. 

Basado en las directrices de Acme Corp, con gusto te aclaro tu duda:

Efectivamente cuentas con **15 días hábiles de vacaciones remuneradas al año**. Para solicitarlos de manera formal, debes ingresar al portal de Talento Humano en la pestaña "Mi Tiempo" con mínimo dos semanas de anticipación para que tu líder directo apruebe las fechas.

¡Disfruta mucho tu tiempo de descanso cuando llegue! Si tienes otra pregunta corporativa (sobre el seguro dental, beneficios de trabajo híbrido, etc.), aquí estoy para ayudarte. 🚀`;
      } else {
        aiResponse = `### 🛡️ REPORTE DE AUDITORÍA DE SEGURIDAD OWASP

**1. Vulnerabilidad Crítica Detectada: SQL Injection (OWASP A03:2021-Injection)**
- **Bloque Sospechoso:**
  \`\`\`javascript
  const query = "SELECT * FROM users WHERE user = '" + req.body.user + "'";
  db.query(query);
  \`\`\`
- **Explicación:** Concatenar variables directamente en strings SQL permite a atacantes insertar payloads que alteren la consulta y evadan el login o extraigan bases de datos.
- **Corrección Sugerida:** Usa consultas preparadas/consultas parametrizadas.

**Código Seguro Corregido:**
\`\`\`javascript
app.post("/login", (req, res) => {
  const query = "SELECT * FROM users WHERE user = ?";
  db.query(query, [req.body.user], (err, results) => {
     // Procesamiento seguro
  });
});
\`\`\`

*Reporte generado de manera óptima por ${editModel}.*`;
      }

      setSandboxResult(aiResponse);
      setIsRunningSandbox(false);
    }, 1200);
  };

  const filteredPrompts = prompts.filter(p => {
    const query = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(query) || p.slug.toLowerCase().includes(query) || p.tags.some(t => t.toLowerCase().includes(query));
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">

      {/* 1. Header Global */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-600/20">
            <Layers className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide flex items-center gap-2">
              PROMPT-ENGINE / <span className="text-indigo-400 font-semibold text-sm px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20">CMS v2.4</span>
            </h1>
            <p className="text-xs text-slate-400">Control de versiones dinámico para APIs de LLM en producción</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right hidden md:block">
            <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-full text-slate-300 font-mono border border-slate-700">
              ⚡ Status: DB-Synchronized
            </span>
          </div>
          <button
            onClick={handleCreateNewPrompt}
            className="bg-indigo-600 hover:bg-indigo-500 transition-all text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center space-x-2 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Prompt</span>
          </button>
        </div>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-4 rounded-xl shadow-2xl flex items-center space-x-3 max-w-md border animate-bounce ${notification.type === 'error' ? 'bg-rose-950/90 border-rose-500 text-rose-200' :
          notification.type === 'warning' ? 'bg-amber-950/90 border-amber-500 text-amber-200' :
            'bg-slate-900/90 border-emerald-500 text-emerald-200'
          }`}>
          {notification.type === 'error' ? <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" /> : <CheckSquare className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
          <div>
            <p className="font-bold text-sm">Notificación de Sistema</p>
            <p className="text-xs opacity-90">{notification.message}</p>
          </div>
        </div>
      )}

      {/* 2. Main Workspace Layout Grid */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

        {/* SIDEBAR: Lista de Prompts Registrados */}
        <aside className="w-full lg:w-80 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0">
          {/* Buscador */}
          <div className="p-4 border-b border-slate-800">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Buscar prompt o tags..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Prompts Navigation List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50 p-2 space-y-1">
            {filteredPrompts.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No se encontraron prompts.
              </div>
            ) : (
              filteredPrompts.map(p => {
                const isActive = p.id === selectedPromptId;
                const deployedVer = p.versions.find(v => v.id === p.current_version_id);
                const activeVerNumber = deployedVer ? deployedVer.version_number : 1;

                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedPromptId(p.id);
                    }}
                    className={`w-full text-left p-3 rounded-lg flex flex-col space-y-2 transition-all group ${isActive
                      ? 'bg-indigo-950/40 border border-indigo-500/30'
                      : 'border border-transparent hover:bg-slate-800/50'
                      }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`font-bold text-xs tracking-wide transition-colors ${isActive ? 'text-indigo-300' : 'text-slate-300 group-hover:text-slate-100'
                        }`}>
                        {p.name}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${isActive ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                        v{activeVerNumber} prod
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>

                    <div className="flex flex-wrap gap-1 pt-1">
                      <span className="text-[9px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-500 font-mono">
                        {p.slug}
                      </span>
                      {p.tags.map((t, idx) => (
                        <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-950/30 border border-indigo-950/80 text-indigo-400">
                          {t}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-col gap-2">
            <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse inline-block"></span>
              <span>API Gateway: Online</span>
            </div>
            <p className="text-[10px] text-slate-500">
              Todos los cambios en caliente afectarán inmediatamente a las integraciones de producción a través del SDK.
            </p>
          </div>
        </aside>

        {/* WORKSPACE PRINCIPAL */}
        <main className="flex-1 bg-slate-950 flex flex-col overflow-hidden">

          {/* HEADER DEL PROMPT SELECCIONADO */}
          <section className="bg-slate-900 border-b border-slate-800 p-6 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-bold tracking-tight text-slate-100">
                  {editName}
                </h2>
                <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" /> Activo en Prod: v{activeDeployedVersion?.version_number}
                </span>
              </div>
              <div className="flex items-center space-x-2 mt-2 text-xs text-slate-400 font-mono">
                <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-bold">SLUG: {editSlug}</span>
                <span>•</span>
                <span>{editDesc}</span>
              </div>
            </div>

            {/* Selector de vistas */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-stretch md:self-auto justify-between">
              <button
                onClick={() => setActiveTab('editor')}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${activeTab === 'editor' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Editor</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Control de Versiones ({activePrompt.versions.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('playground')}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${activeTab === 'playground' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                <Play className="w-3.5 h-3.5 animate-pulse" />
                <span>Playground</span>
              </button>
            </div>
          </section>

          {/* AREA DINÁMICA DE VISTA */}
          <div className="flex-1 overflow-y-auto">

            {/* VISTA 1: EDITOR DE PROMPTS */}
            {activeTab === 'editor' && (
              <div className="p-6 grid grid-cols-1 xl:grid-cols-4 gap-6">

                {/* Panel Editor de texto (Columna de la izquierda) */}
                <div className="xl:col-span-3 space-y-6">

                  {/* System Prompt (Rol) */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-xs font-bold tracking-wider text-slate-300 uppercase flex items-center gap-1.5">
                        <Terminal className="w-4 h-4 text-indigo-400" /> System Prompt (Instrucción Base)
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono">Modo: System Developer</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                      Define la personalidad, directrices generales, restricciones de seguridad y el comportamiento estricto del LLM.
                    </p>
                    <textarea
                      rows={6}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
                      placeholder="Ej: Eres un asistente experto en seguridad cibernética..."
                      value={editSystemPrompt}
                      onChange={(e) => setEditSystemPrompt(e.target.value)}
                    />
                  </div>

                  {/* User Prompt (Template) */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-xs font-bold tracking-wider text-slate-300 uppercase flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-indigo-400" /> User Prompt Template
                      </label>
                      <span className="text-[10px] bg-slate-800 text-indigo-300 font-mono px-2 py-0.5 rounded">
                        Mapea variables usando {"{{nombre_variable}}"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                      Este template será procesado por tu backend reemplazando las variables dinámicas que envíe tu lógica de negocio.
                    </p>
                    <textarea
                      rows={6}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
                      placeholder="Ej: Hola {{usuario}}, por favor procesa esto: {{input_data}}"
                      value={editUserTemplate}
                      onChange={(e) => setEditUserTemplate(e.target.value)}
                    />

                    {/* Detección de Variables detectadas */}
                    <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-slate-500" /> Variables detectadas en el texto:
                      </span>
                      {detectedVariables.length === 0 ? (
                        <span className="text-xs text-slate-500 italic">Ninguna variable detectada. Añade llaves dobles {"{{mi_variable}}"}</span>
                      ) : (
                        detectedVariables.map((v, i) => (
                          <span key={i} className="text-xs px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono font-bold flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-indigo-400" /> {v}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Panel de metadatos rápidos por si el Admin quiere editar la descripción */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Nombre del Prompt</label>
                      <input
                        type="text"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Slug identificador de API</label>
                      <input
                        type="text"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                        value={editSlug}
                        onChange={(e) => setEditSlug(e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Descripción Funcional</label>
                      <input
                        type="text"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                      />
                    </div>
                  </div>

                </div>

                {/* Panel de Configuración e Guardado (Columna de la Derecha) */}
                <div className="space-y-6">

                  {/* Model Settings */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
                    <h3 className="text-xs font-bold tracking-wider text-slate-300 uppercase flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-indigo-400" /> Parámetros del LLM
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      El modelo y los hiperparámetros están atados a esta versión del prompt. No alteres código de infraestructura para testear.
                    </p>

                    {/* Modelo dropdown */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-slate-400 uppercase">Modelo de IA</label>
                      <select
                        value={editModel}
                        onChange={(e) => setEditModel(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
                      >
                        <option value="gpt-4o">GPT-4o (Complejo, Razonamiento)</option>
                        <option value="gpt-4o-mini">GPT-4o Mini (Ultra-rápido, Económico)</option>
                        <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (Altamente Contextual)</option>
                        <option value="meta-llama-3-1-70b">Llama 3.1 70B (Open-Source)</option>
                      </select>
                    </div>

                    {/* Slider Temperatura */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] text-slate-400 uppercase">Temperatura: <span className="text-indigo-400 font-mono font-bold">{editTemp}</span></label>
                        <span className="text-[10px] text-slate-500">{editTemp <= 0.2 ? 'Predecible/Determinista' : editTemp >= 0.7 ? 'Creativo/Variable' : 'Balanceado'}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={editTemp}
                        onChange={(e) => setEditTemp(parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>

                    {/* Max Tokens input */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-slate-400 uppercase">Límite Máximo de Tokens (Max Tokens)</label>
                      <input
                        type="number"
                        value={editMaxTokens}
                        onChange={(e) => setEditMaxTokens(parseInt(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Guardar cambios (Publicar versión nueva) */}
                  <div className="bg-slate-900 border border-indigo-500/20 rounded-xl p-5 space-y-4 shadow-lg shadow-indigo-600/5">
                    <h3 className="text-xs font-bold tracking-wider text-slate-300 uppercase flex items-center gap-1.5">
                      <GitBranch className="w-4 h-4 text-emerald-400" /> Crear nueva Versión
                    </h3>

                    <div className="space-y-1.5">
                      <label className="text-[11px] text-slate-400 uppercase">Bitácora de Cambios (Changelog)</label>
                      <textarea
                        rows={3}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        placeholder="Describe los cambios de este ajuste para que tu equipo entienda el porqué de la versión."
                        value={editChangelog}
                        onChange={(e) => setEditChangelog(e.target.value)}
                      />
                    </div>

                    <button
                      onClick={handleSaveNewVersion}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-lg text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-indigo-600/20"
                    >
                      <Save className="w-4 h-4" />
                      <span>Guardar como Borrador (v{Math.max(...activePrompt.versions.map(v => v.version_number)) + 1})</span>
                    </button>

                    <div className="border-t border-slate-800 pt-3">
                      <p className="text-[10px] text-slate-400 leading-relaxed italic text-center">
                        Para activar esta nueva versión en tus flujos de usuario, ve a la pestaña "Control de Versiones" y dale clic a "Promover a Prod".
                      </p>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* VISTA 2: CONTROL DE VERSIONES & DIFF VISUAL */}
            {activeTab === 'history' && (
              <div className="p-6 space-y-6">

                {/* Comparador de versiones (Diff tool) */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                  <h3 className="text-xs font-bold tracking-wider text-slate-300 uppercase mb-3 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-indigo-400" /> COMPARADOR DE VERSIONES (DIFF VIEWER)
                  </h3>
                  <p className="text-xs text-slate-400 mb-5">
                    Selecciona dos versiones para ver cómo evolucionaron las instrucciones de tu asistente a lo largo del tiempo.
                  </p>

                  <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4 bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <div className="flex items-center space-x-3 w-full md:w-auto">
                      <span className="text-xs font-mono text-slate-400">Versión A (Anterior):</span>
                      <select
                        value={diffVerA}
                        onChange={(e) => setDiffVerA(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-300 focus:outline-none"
                      >
                        {activePrompt.versions.map(v => (
                          <option key={v.id} value={v.id}>v{v.version_number} - {v.created_by.split(' ')[0]}</option>
                        ))}
                      </select>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 hidden md:block" />
                    <div className="flex items-center space-x-3 w-full md:w-auto">
                      <span className="text-xs font-mono text-slate-400">Versión B (Nueva):</span>
                      <select
                        value={diffVerB}
                        onChange={(e) => setDiffVerB(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-300 focus:outline-none"
                      >
                        {activePrompt.versions.map(v => (
                          <option key={v.id} value={v.id}>v{v.version_number} - {v.created_by.split(' ')[0]}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Comparación Visual de System Prompt de forma estática y simulada con highlights de diff */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <div className="bg-slate-950/80 p-4 rounded-lg border border-slate-800">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">Versión A (v{activePrompt.versions.find(v => v.id === diffVerA)?.version_number})</span>
                        <span className="text-[10px] text-slate-500 font-mono">Modelo: {activePrompt.versions.find(v => v.id === diffVerA)?.model_settings.model}</span>
                      </div>
                      <div className="bg-slate-950 p-3 rounded font-mono text-[11px] text-rose-300 border border-rose-950/40 whitespace-pre-wrap max-h-60 overflow-y-auto">
                        {activePrompt.versions.find(v => v.id === diffVerA)?.system_prompt}
                      </div>
                    </div>

                    <div className="bg-slate-950/80 p-4 rounded-lg border border-slate-800">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">Versión B (v{activePrompt.versions.find(v => v.id === diffVerB)?.version_number})</span>
                        <span className="text-[10px] text-slate-500 font-mono">Modelo: {activePrompt.versions.find(v => v.id === diffVerB)?.model_settings.model}</span>
                      </div>
                      <div className="bg-slate-950 p-3 rounded font-mono text-[11px] text-emerald-300 border border-emerald-950/40 whitespace-pre-wrap max-h-60 overflow-y-auto">
                        {activePrompt.versions.find(v => v.id === diffVerB)?.system_prompt}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Historial Timeline de Versiones */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <h3 className="text-xs font-bold tracking-wider text-slate-300 uppercase mb-6 flex items-center gap-2">
                    <History className="w-4 h-4 text-indigo-400" /> HISTORIAL DE CAMBIOS Y ACTIVACIÓN (TIMELINE)
                  </h3>

                  <div className="relative border-l border-slate-800 ml-3 md:ml-6 space-y-6">
                    {activePrompt.versions.map((ver, idx) => {
                      const isDeployed = ver.id === activePrompt.current_version_id;

                      return (
                        <div key={ver.id} className="relative pl-6 md:pl-10">

                          {/* Nodo del Timeline */}
                          <div className={`absolute -left-3 md:-left-3.5 top-1.5 w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center border text-xs ${isDeployed
                            ? 'bg-emerald-500 text-slate-950 border-emerald-500 ring-4 ring-emerald-500/10'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}>
                            {isDeployed ? <Check className="w-3.5 h-3.5" /> : ver.version_number}
                          </div>

                          <div className={`p-5 rounded-xl border transition-all ${isDeployed
                            ? 'bg-emerald-950/10 border-emerald-500/30'
                            : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                            }`}>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3">
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-sm text-slate-200">
                                  Versión {ver.version_number}.0
                                </span>
                                {isDeployed ? (
                                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/30">
                                    PRODUCCIÓN ACTIVO
                                  </span>
                                ) : (
                                  <span className="bg-slate-800 text-slate-400 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                                    Borrador Histórico
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500 font-mono mt-1 md:mt-0">
                                {new Date(ver.created_at).toLocaleString('es-ES')}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-xs">
                              <div className="bg-slate-900/50 p-3 rounded border border-slate-800">
                                <span className="text-slate-500 block uppercase text-[9px] font-bold">Modelo Asignado</span>
                                <span className="font-mono text-indigo-300 text-xs">{ver.model_settings.model}</span>
                              </div>
                              <div className="bg-slate-900/50 p-3 rounded border border-slate-800">
                                <span className="text-slate-500 block uppercase text-[9px] font-bold">Parámetros</span>
                                <span className="font-mono text-slate-300">Temp: {ver.model_settings.temperature} | Max: {ver.model_settings.max_tokens}</span>
                              </div>
                              <div className="bg-slate-900/50 p-3 rounded border border-slate-800">
                                <span className="text-slate-500 block uppercase text-[9px] font-bold">Modificado Por</span>
                                <span className="text-slate-300">{ver.created_by}</span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <span className="text-xs text-slate-500 block uppercase text-[9px] font-bold">Bitácora del Cambio (Changelog):</span>
                              <p className="text-xs text-slate-300 italic bg-slate-900 p-2.5 rounded border border-slate-800">
                                "{ver.changelog}"
                              </p>
                            </div>

                            {/* Acciones de Rollback / Promoción */}
                            {!isDeployed && (
                              <div className="mt-4 pt-4 border-t border-slate-800 flex justify-end space-x-3">
                                <button
                                  onClick={() => {
                                    setEditSystemPrompt(ver.system_prompt);
                                    setEditUserTemplate(ver.user_prompt_template);
                                    setEditModel(ver.model_settings.model);
                                    setEditTemp(ver.model_settings.temperature);
                                    setEditMaxTokens(ver.model_settings.max_tokens);
                                    setActiveTab('editor');
                                    showToast(`Cargada versión v${ver.version_number} en el editor.`, 'success');
                                  }}
                                  className="text-[11px] bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 px-3.5 py-1.5 rounded-lg font-semibold text-slate-300 transition-all flex items-center space-x-1.5"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Cargar en Editor</span>
                                </button>
                                <button
                                  onClick={() => handleDeployVersion(ver.id)}
                                  className="text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 shadow-md shadow-emerald-600/10"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Activar / Rollback a esta versión</span>
                                </button>
                              </div>
                            )}

                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* VISTA 3: PLAYGROUND SIMULADO */}
            {activeTab === 'playground' && (
              <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Inputs de variables dinámicas detectadas */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold tracking-wider text-slate-300 uppercase flex items-center gap-1.5">
                      <Terminal className="w-4 h-4 text-indigo-400" /> SIMULADOR DE VARIABLES DEL TEMPLATE
                    </h3>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/20 font-mono">
                      {detectedVariables.length} variables
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Ingresa los datos de simulación. El playground renderizará tu prompt dinámicamente y disparará una llamada simulada al modelo asignado: <strong className="text-indigo-300 font-mono">{editModel}</strong>.
                  </p>

                  <div className="space-y-4 pt-2">
                    {detectedVariables.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-slate-800 rounded-lg text-slate-500 text-xs">
                        Este prompt no cuenta con variables dinámicas {"{{mi_variable}}"}. Puedes simular una llamada directa.
                      </div>
                    ) : (
                      detectedVariables.map((variable) => (
                        <div key={variable} className="space-y-1.5">
                          <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                            {"{{"}{variable}{"}}"}
                          </label>
                          {variable.includes('contexto') || variable.includes('codigo') ? (
                            <textarea
                              rows={4}
                              value={sandboxVariables[variable] || ''}
                              onChange={(e) => setSandboxVariables({ ...sandboxVariables, [variable]: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                            />
                          ) : (
                            <input
                              type="text"
                              value={sandboxVariables[variable] || ''}
                              onChange={(e) => setSandboxVariables({ ...sandboxVariables, [variable]: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                            />
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    onClick={runSandboxSimulation}
                    disabled={isRunningSandbox}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold py-3 px-4 rounded-lg text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-indigo-600/20"
                  >
                    {isRunningSandbox ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Simulando Inferencia...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span>Ejecutar Simulación con {editModel}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Resultado Renderizado de Prompt & Response */}
                <div className="space-y-6">

                  {/* Vista previa del prompt que se enviará al modelo */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-3 font-mono">
                      PROMPT RENDERIZADO FINAL (PREVIA ENVIADA A API)
                    </h3>
                    <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-xs text-slate-400 font-mono space-y-3 max-h-48 overflow-y-auto leading-relaxed">
                      <div>
                        <span className="text-indigo-400 font-bold block mb-1">--- SYSTEM INSTRUCTION ---</span>
                        <p>{editSystemPrompt}</p>
                      </div>
                      <div className="border-t border-slate-900 pt-2">
                        <span className="text-indigo-400 font-bold block mb-1">--- USER PROMPT ---</span>
                        <p>
                          {editUserTemplate.split(/{{\s*[a-zA-Z0-9_-]+\s*}}/g).map((chunk, i) => {
                            // Render with highlighted simulated variables inside
                            const vNames = detectedVariables;
                            return (
                              <React.Fragment key={i}>
                                {chunk}
                                {vNames[i] && (
                                  <span className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-1 py-0.2 rounded mx-0.5">
                                    {sandboxVariables[vNames[i]] || `[${vNames[i]}]`}
                                  </span>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Respuesta del LLM simulado */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-inner">
                    <h3 className="text-xs font-bold tracking-wider text-slate-300 uppercase mb-3 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-400" /> RESPUESTA SIMULADA DEL MODELO
                    </h3>
                    <div className="bg-slate-950 p-5 rounded-lg border border-slate-850 min-h-[16rem] flex flex-col justify-between">
                      {sandboxResult ? (
                        <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                          {sandboxResult}
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 py-10">
                          <Terminal className="w-8 h-8 text-slate-700 mb-2" />
                          <p className="text-xs">Usa el panel de la izquierda para rellenar variables y simular la llamada.</p>
                        </div>
                      )}

                      <div className="border-t border-slate-900/80 pt-3 mt-4 flex justify-between items-center text-[10px] text-slate-500">
                        <span>Latencia Sim.: 1.2s</span>
                        <span>Consumo estimado: ~840 tokens</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}

          </div>

          {/* BARRA DE ESTADO INFERIOR */}
          <footer className="bg-slate-900 border-t border-slate-800 px-6 py-3 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping"></span>
              <span>Visualizando la versión de desarrollo en caliente</span>
            </div>
            <div className="mt-2 sm:mt-0 font-mono">
              Hecho con ♥ para tu Prompt-Ops Pipeline • 2026
            </div>
          </footer>

        </main>

      </div>

    </div>
  );
}