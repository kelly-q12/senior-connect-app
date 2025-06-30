import React, { useState, useEffect, useRef } from 'react';

// Se asume que Tailwind CSS está configurado en el entorno.

const App = () => {
    // Estados de la aplicación
    const [listening, setListening] = useState(false); // Estado para controlar si el asistente está escuchando
    const [transcript, setTranscript] = useState(''); // Transcripción de lo que el usuario dice
    const [response, setResponse] = useState('¡Hola! ¿En qué puedo ayudarte?'); // Respuesta del asistente
    const [messages, setMessages] = useState([]); // Simulacro de mensajes
    const [reminders, setReminders] = useState([]); // Simulacro de recordatorios
    const [medicationRequests, setMedicationRequests] = useState([]); // Nuevas solicitudes de medicamentos
    const [appointments, setAppointments] = useState([]); // Nuevas citas médicas
    const [activeSection, setActiveSection] = useState('home'); // Sección activa: 'home', 'videollamadas', 'mensajes', 'recordatorios', 'actividades', 'emergencia', 'recetas', 'medicamentos', 'citasMedicas', 'hospitalesCercanos'
    const [generatedRecipe, setGeneratedRecipe] = useState(null); // Para almacenar la receta generada
    const recognitionRef = useRef(null); // Referencia para el objeto SpeechRecognition
    const synthRef = useRef(null); // Referencia para el objeto SpeechSynthesis

    // Inicialización del reconocimiento de voz y síntesis de voz
    useEffect(() => {
        // Inicializar el reconocimiento de voz
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false; // Escucha una sola vez
            recognition.lang = 'es-ES'; // Idioma español

            recognition.onstart = () => {
                setListening(true);
                setResponse('Escuchando...');
                console.log('Reconocimiento de voz iniciado.');
            };

            recognition.onresult = (event) => {
                const currentTranscript = event.results[0][0].transcript;
                setTranscript(currentTranscript);
                console.log('Transcripción:', currentTranscript);
                processCommand(currentTranscript);
            };

            recognition.onend = () => {
                setListening(false);
                console.log('Reconocimiento de voz finalizado.');
            };

            recognition.onerror = (event) => {
                console.error('Error en el reconocimiento de voz:', event.error);
                setResponse('Lo siento, hubo un error con el reconocimiento de voz.');
                setListening(false);
            };
            recognitionRef.current = recognition;
        } else {
            setResponse('Tu navegador no soporta el reconocimiento de voz. Te recomiendo usar Google Chrome.');
            console.warn('Speech Recognition API no soportada.');
        }

        // Inicializar la síntesis de voz
        synthRef.current = window.speechSynthesis;

        // Limpiar al desmontar el componente
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    // Función para hablar
    const speak = (text) => {
        if (synthRef.current && text) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'es-ES';
            synthRef.current.speak(utterance);
        }
    };

    // Función para iniciar o detener la escucha
    const toggleListening = () => {
        if (listening) {
            recognitionRef.current.stop();
        } else {
            setTranscript('');
            recognitionRef.current.start();
        }
    };

    // Función para procesar los comandos de voz
    const processCommand = async (command) => {
        const lowerCommand = command.toLowerCase();
        let assistantResponse = '';

        setResponse('Procesando tu solicitud...');
        speak('Procesando tu solicitud.');

        if (lowerCommand.includes('hola') || lowerCommand.includes('saludo')) {
            assistantResponse = '¡Hola! ¿Cómo puedo ayudarte hoy?';
        } else if (lowerCommand.includes('videollamada') || lowerCommand.includes('llamar a')) {
            assistantResponse = 'Abriendo la sección de videollamadas. ¿A quién te gustaría llamar?';
            setActiveSection('videollamadas');
        } else if (lowerCommand.includes('mensaje') || lowerCommand.includes('enviar mensaje')) {
            assistantResponse = 'Abriendo la sección de mensajes. ¿A quién le quieres enviar un mensaje y qué quieres decir?';
            setActiveSection('mensajes');
        } else if (lowerCommand.includes('recordatorio') || lowerCommand.includes('crear recordatorio')) {
            assistantResponse = 'Abriendo la sección de recordatorios. ¿Qué recordatorio te gustaría añadir?';
            setActiveSection('recordatorios');
        } else if (lowerCommand.includes('actividades') || lowerCommand.includes('eventos')) {
            assistantResponse = 'Buscando actividades y eventos cerca de ti. ¿Hay algo específico que te interese?';
            setActiveSection('actividades');
        } else if (lowerCommand.includes('emergencia') || lowerCommand.includes('ayuda')) {
            assistantResponse = 'Activando servicios de emergencia. Mantén la calma, la ayuda está en camino.';
            setActiveSection('emergencia');
        } else if (lowerCommand.includes('me siento') || lowerCommand.includes('estoy triste') || lowerCommand.includes('estoy solo') || lowerCommand.includes('estoy feliz')) {
            // Apoyo Emocional Mejorado con Gemini
            try {
                const apiKey = "TU_API_KEY_GEMINI"; // La clave API será proporcionada por el entorno de Canvas o configurada como variable de entorno
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
                const chatHistory = [{
                    role: "user",
                    parts: [{ text: `El usuario dice: "${lowerCommand}". Ofrece palabras de apoyo, aliento y sugiere una actividad sencilla y positiva para mejorar su estado de ánimo, manteniendo un tono cálido y empático. Responde en español y no uses lenguaje técnico.` }]
                }];
                const payload = { contents: chatHistory };

                const res = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await res.json();

                if (result.candidates && result.candidates.length > 0 && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts.length > 0) {
                    assistantResponse = result.candidates[0].content.parts[0].text;
                } else {
                    assistantResponse = 'Gracias por compartir cómo te sientes. Siempre estoy aquí para escucharte.';
                }
            } catch (error) {
                console.error('Error al llamar a la API de Gemini para apoyo emocional:', error);
                assistantResponse = 'Lo siento, hubo un problema al procesar tu solicitud. Por favor, inténtalo de nuevo.';
            }
        } else if (lowerCommand.includes('receta') || lowerCommand.includes('qué puedo cocinar') || lowerCommand.includes('dame una receta')) {
            // Generador de Recetas Saludables con Gemini
            const query = lowerCommand.replace('dame una receta de', '').replace('qué puedo cocinar con', '').trim();
            try {
                const apiKey = "TU_API_KEY_GEMINI"; // Asegúrate de reemplazar con tu clave real
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
                const chatHistory = [{
                    role: "user",
                    parts: [{ text: `Genera una receta saludable en formato JSON con los siguientes campos: 'recipeName' (string), 'ingredients' (array de strings), y 'instructions' (array de strings), para el siguiente tema/ingredientes: ${query || 'una receta saludable y fácil'}.` }]
                }];
                const payload = {
                    contents: chatHistory,
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: "OBJECT",
                            properties: {
                                "recipeName": { "type": "STRING" },
                                "ingredients": { "type": "ARRAY", "items": { "type": "STRING" } },
                                "instructions": { "type": "ARRAY", "items": { "type": "STRING" } }
                            },
                            "propertyOrdering": ["recipeName", "ingredients", "instructions"]
                        }
                    }
                };

                const res = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await res.json();

                if (result.candidates && result.candidates.length > 0 && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts.length > 0) {
                    const jsonResponse = JSON.parse(result.candidates[0].content.parts[0].text);
                    setGeneratedRecipe(jsonResponse);
                    setActiveSection('recetas');
                    assistantResponse = `¡Aquí tienes una receta para "${jsonResponse.recipeName}"!`;
                } else {
                    assistantResponse = 'Lo siento, no pude generar una receta en este momento. ¿Puedes ser más específico?';
                }
            } catch (error) {
                console.error('Error al llamar a la API de Gemini para recetas:', error);
                assistantResponse = 'Hubo un problema al generar la receta. Por favor, inténtalo de nuevo.';
            }
        } else if (lowerCommand.includes('medicamento') || lowerCommand.includes('solicitar medicamento')) {
            assistantResponse = 'Abriendo la sección de solicitud de medicamentos. Por favor, dime qué medicamento necesitas y la cantidad.';
            setActiveSection('medicamentos');
        } else if (lowerCommand.includes('cita médica') || lowerCommand.includes('agendar cita') || lowerCommand.includes('citas')) {
            assistantResponse = 'Abriendo la sección de citas médicas. Puedes agendar una nueva cita o revisar tus citas existentes.';
            setActiveSection('citasMedicas');
        } else if (lowerCommand.includes('hospital cercano') || lowerCommand.includes('hospitales cercanos') || lowerCommand.includes('dónde hay un hospital')) {
            assistantResponse = 'Buscando hospitales cercanos. Necesitaré permiso para acceder a tu ubicación.';
            setActiveSection('hospitalesCercanos');
        } else if (lowerCommand.includes('rutina') || lowerCommand.includes('salud')) {
            assistantResponse = 'Para el seguimiento de rutinas y salud, puedo ayudarte a configurar recordatorios o buscar información. ¿Qué necesitas específicamente?';
            setActiveSection('recordatorios'); // O una nueva sección de salud
        } else if (lowerCommand.includes('regresar') || lowerCommand.includes('inicio') || lowerCommand.includes('volver')) {
            assistantResponse = 'Volviendo a la página de inicio.';
            setActiveSection('home');
            setGeneratedRecipe(null); // Limpiar receta al volver a inicio
        } else if (lowerCommand.includes('qué hora es')) {
            const now = new Date();
            assistantResponse = `Son las ${now.getHours()} y ${now.getMinutes()} minutos.`;
        } else if (lowerCommand.includes('qué día es hoy')) {
            const today = new Date();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            assistantResponse = `Hoy es ${today.toLocaleDateString('es-ES', options)}.`;
        } else {
            // Fallback para cualquier otra pregunta general usando Gemini
            try {
                const apiKey = "TU_API_KEY_GEMINI"; // Asegúrate de reemplazar con tu clave real
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
                const chatHistory = [{ role: "user", parts: [{ text: lowerCommand }] }];
                const payload = { contents: chatHistory };

                const res = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await res.json();

                if (result.candidates && result.candidates.length > 0 && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts.length > 0) {
                    assistantResponse = result.candidates[0].content.parts[0].text;
                } else {
                    assistantResponse = 'Lo siento, no pude entender tu solicitud. ¿Podrías repetirla?';
                }
            } catch (error) {
                console.error('Error al llamar a la API de Gemini (general):', error);
                assistantResponse = 'Hubo un problema al procesar tu solicitud con el asistente. Por favor, inténtalo de nuevo.';
            }
        }

        setResponse(assistantResponse);
        speak(assistantResponse);
    };

    // Funciones simuladas para las secciones
    const handleSendMessage = (e) => {
        e.preventDefault();
        const recipient = e.target.recipient.value;
        const messageText = e.target.message.value;
        if (recipient && messageText) {
            setMessages([...messages, { recipient, text: messageText, type: 'sent' }]);
            e.target.reset();
            setResponse('Mensaje enviado.');
            speak('Mensaje enviado.');
        } else {
            setResponse('Por favor, ingresa el destinatario y el mensaje.');
            speak('Por favor, ingresa el destinatario y el mensaje.');
        }
    };

    const handleAddReminder = (e) => {
        e.preventDefault();
        const reminderText = e.target.reminder.value;
        if (reminderText) {
            setReminders([...reminders, { id: Date.now(), text: reminderText, completed: false }]);
            e.target.reset();
            setResponse('Recordatorio añadido.');
            speak('Recordatorio añadido.');
        } else {
            setResponse('Por favor, ingresa el recordatorio.');
            speak('Por favor, ingresa el recordatorio.');
        }
    };

    const handleCallLovedOne = (name) => {
        setResponse(`Llamando a ${name}...`);
        speak(`Llamando a ${name}.`);
        // Aquí se integraría la lógica real de videollamada
    };

    const handleEmergencyCall = () => {
        setResponse('Llamando a servicios de emergencia. Mantén la calma.');
        speak('Llamando a servicios de emergencia. Mantén la calma.');
        // Aquí se integraría la lógica real de llamada de emergencia
    };

    // Nueva función para manejar la solicitud de medicamentos
    const handleMedicationRequest = (e) => {
        e.preventDefault();
        const medicationName = e.target.medicationName.value;
        const dosage = e.target.dosage.value;
        const frequency = e.target.frequency.value;
        if (medicationName && dosage && frequency) {
            setMedicationRequests([...medicationRequests, { medicationName, dosage, frequency, date: new Date().toLocaleDateString() }]);
            e.target.reset();
            setResponse('Solicitud de medicamento registrada.');
            speak('Solicitud de medicamento registrada.');
        } else {
            setResponse('Por favor, completa todos los campos para la solicitud de medicamento.');
            speak('Por favor, completa todos los campos para la solicitud de medicamento.');
        }
    };

    // Nueva función para manejar la programación de citas
    const handleAddAppointment = (e) => {
        e.preventDefault();
        const doctorName = e.target.doctorName.value;
        const appointmentDate = e.target.appointmentDate.value;
        const appointmentTime = e.target.appointmentTime.value;
        if (doctorName && appointmentDate && appointmentTime) {
            setAppointments([...appointments, { doctorName, appointmentDate, appointmentTime, id: Date.now() }]);
            e.target.reset();
            setResponse('Cita médica agendada.');
            speak('Cita médica agendada.');
        } else {
            setResponse('Por favor, completa todos los campos para la cita médica.');
            speak('Por favor, completa todos los campos para la cita médica.');
        }
    };

    // Función simulada para obtener hospitales cercanos
    const getNearbyHospitals = () => {
        setResponse('Buscando hospitales cercanos...');
        speak('Buscando hospitales cercanos.');

        // En un escenario real, aquí usarías la Geolocation API del navegador
        // para obtener la ubicación del usuario y luego una API de mapas (ej. Google Maps Places API)
        // para encontrar hospitales. Dado que no tenemos acceso a la ubicación real
        // en este entorno, proporcionaremos datos simulados.
        const simulatedHospitals = [
            { name: 'Hospital Central', address: 'Calle Principal 123', distance: '2.5 km', phone: '555-1234' },
            { name: 'Clínica del Valle', address: 'Avenida Siempre Viva 45', distance: '4.1 km', phone: '555-5678' },
            { name: 'Centro Médico San Juan', address: 'Plaza Mayor s/n', distance: '7.8 km', phone: '555-9012' },
        ];
        // Aquí se actualizaría el estado con los hospitales reales
        // Por ahora, solo lo mostraremos en la respuesta del asistente.
        let hospitalList = simulatedHospitals.map(h => `${h.name} a ${h.distance}`).join(', ');
        if (simulatedHospitals.length > 0) {
            setResponse(`Los hospitales más cercanos son: ${hospitalList}. Para una búsqueda precisa, permite el acceso a tu ubicación.`);
            speak(`Los hospitales más cercanos son: ${hospitalList}. Para una búsqueda precisa, permite el acceso a tu ubicación.`);
        } else {
            setResponse('No se encontraron hospitales cercanos. Asegúrate de tener el GPS activado y de permitir el acceso a tu ubicación.');
            speak('No se encontraron hospitales cercanos. Asegúrate de tener el GPS activado y de permitir el acceso a tu ubicación.');
        }
    };


    const renderContent = () => {
        switch (activeSection) {
            case 'home':
                return (
                    <div className="text-center p-6 bg-gray-50 rounded-2xl shadow-inner max-w-lg mx-auto">
                        <h2 className="text-3xl font-bold text-gray-800 mb-4">Bienvenido a Senior Connect</h2>
                        <p className="text-lg text-gray-600 mb-6">
                            Tu asistente personal para una vida más fácil y conectada.
                            Usa el botón del micrófono para empezar a interactuar.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
                                onClick={() => {
                                    setActiveSection('videollamadas');
                                    setResponse('Sección de videollamadas.');
                                    speak('Sección de videollamadas.');
                                }}
                            >
                                <i className="fas fa-video mr-2"></i> Videollamadas
                            </button>
                            <button
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
                                onClick={() => {
                                    setActiveSection('mensajes');
                                    setResponse('Sección de mensajes.');
                                    speak('Sección de mensajes.');
                                }}
                            >
                                <i className="fas fa-comments mr-2"></i> Mensajes
                            </button>
                            <button
                                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
                                onClick={() => {
                                    setActiveSection('recordatorios');
                                    setResponse('Sección de recordatorios.');
                                    speak('Sección de recordatorios.');
                                }}
                            >
                                <i className="fas fa-bell mr-2"></i> Recordatorios
                            </button>
                            <button
                                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
                                onClick={() => {
                                    setActiveSection('actividades');
                                    setResponse('Sección de actividades.');
                                    speak('Sección de actividades.');
                                }}
                            >
                                <i className="fas fa-calendar-alt mr-2"></i> Actividades
                            </button>
                            <button
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
                                onClick={() => {
                                    setActiveSection('recetas');
                                    setResponse('Sección de recetas. ¿Qué receta te gustaría encontrar?');
                                    speak('Sección de recetas. Qué receta te gustaría encontrar?');
                                }}
                            >
                                <i className="fas fa-utensils mr-2"></i> Recetas Saludables
                            </button>
                            <button
                                className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
                                onClick={() => {
                                    setActiveSection('medicamentos');
                                    setResponse('Sección de solicitud de medicamentos.');
                                    speak('Sección de solicitud de medicamentos.');
                                }}
                            >
                                <i className="fas fa-pills mr-2"></i> Medicamentos
                            </button>
                            <button
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
                                onClick={() => {
                                    setActiveSection('citasMedicas');
                                    setResponse('Sección de citas médicas.');
                                    speak('Sección de citas médicas.');
                                }}
                            >
                                <i className="fas fa-user-md mr-2"></i> Citas Médicas
                            </button>
                            <button
                                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
                                onClick={() => {
                                    setActiveSection('hospitalesCercanos');
                                    setResponse('Buscando hospitales cercanos.');
                                    speak('Buscando hospitales cercanos.');
                                }}
                            >
                                <i className="fas fa-hospital mr-2"></i> Hospitales Cercanos
                            </button>
                            <button
                                className="col-span-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
                                onClick={() => {
                                    setActiveSection('emergencia');
                                    setResponse('Activando servicios de emergencia.');
                                    speak('Activando servicios de emergencia.');
                                }}
                            >
                                <i className="fas fa-ambulance mr-2"></i> Emergencia
                            </button>
                        </div>
                    </div>
                );
            case 'videollamadas':
                return (
                    <div className="p-6 bg-gray-50 rounded-2xl shadow-inner max-w-lg mx-auto">
                        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Videollamadas</h2>
                        <div className="grid grid-cols-1 gap-4">
                            <button
                                className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                                onClick={() => handleCallLovedOne('Juan')}
                            >
                                <i className="fas fa-user mr-2"></i> Llamar a Juan
                            </button>
                            <button
                                className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                                onClick={() => handleCallLovedOne('María')}
                            >
                                <i className="fas fa-user mr-2"></i> Llamar a María
                            </button>
                            <button
                                className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                                onClick={() => handleCallLovedOne('Ana')}
                            >
                                <i className="fas fa-user mr-2"></i> Llamar a Ana
                            </button>
                        </div>
                        <button
                            className="mt-6 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition duration-300 ease-in-out transform hover:scale-105 w-full"
                            onClick={() => setActiveSection('home')}
                        >
                            Volver al Inicio
                        </button>
                    </div>
                );
            case 'mensajes':
                return (
                    <div className="p-6 bg-gray-50 rounded-2xl shadow-inner max-w-lg mx-auto">
                        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Mensajes</h2>
                        <form onSubmit={handleSendMessage} className="space-y-4">
                            <div>
                                <label htmlFor="recipient" className="block text-gray-700 text-lg font-medium mb-2">Destinatario:</label>
                                <input
                                    type="text"
                                    id="recipient"
                                    name="recipient"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                                    placeholder="Ej: Juan, Doctor"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="message" className="block text-gray-700 text-lg font-medium mb-2">Mensaje:</label>
                                <textarea
                                    id="message"
                                    name="message"
                                    rows="4"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                                    placeholder="Escribe tu mensaje aquí..."
                                    required
                                ></textarea>
                            </div>
                            <button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105 w-full"
                            >
                                Enviar Mensaje
                            </button>
                        </form>
                        <div className="mt-8">
                            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Mensajes Enviados:</h3>
                            {messages.length === 0 ? (
                                <p className="text-gray-600 text-lg">No hay mensajes enviados aún.</p>
                            ) : (
                                <ul className="space-y-3">
                                    {messages.map((msg, index) => (
                                        <li key={index} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                            <p className="text-gray-800 text-lg">
                                                <span className="font-semibold">Para:</span> {msg.recipient}
                                            </p>
                                            <p className="text-gray-600 text-md mt-1">{msg.text}</p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <button
                            className="mt-6 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition duration-300 ease-in-out transform hover:scale-105 w-full"
                            onClick={() => setActiveSection('home')}
                        >
                            Volver al Inicio
                        </button>
                    </div>
                );
            case 'recordatorios':
                return (
                    <div className="p-6 bg-gray-50 rounded-2xl shadow-inner max-w-lg mx-auto">
                        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Recordatorios</h2>
                        <form onSubmit={handleAddReminder} className="space-y-4">
                            <div>
                                <label htmlFor="reminder" className="block text-gray-700 text-lg font-medium mb-2">Nuevo Recordatorio:</label>
                                <input
                                    type="text"
                                    id="reminder"
                                    name="reminder"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-lg"
                                    placeholder="Ej: Tomar medicamento a las 9 AM"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105 w-full"
                            >
                                Añadir Recordatorio
                            </button>
                        </form>
                        <div className="mt-8">
                            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Mis Recordatorios:</h3>
                            {reminders.length === 0 ? (
                                <p className="text-gray-600 text-lg">No hay recordatorios añadidos aún.</p>
                            ) : (
                                <ul className="space-y-3">
                                    {reminders.map((r) => (
                                        <li key={r.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
                                            <span className={`text-gray-800 text-lg ${r.completed ? 'line-through text-gray-500' : ''}`}>
                                                {r.text}
                                            </span>
                                            <input
                                                type="checkbox"
                                                checked={r.completed}
                                                onChange={() => setReminders(reminders.map(item => item.id === r.id ? { ...item, completed: !item.completed } : item))}
                                                className="form-checkbox h-6 w-6 text-green-600 rounded"
                                            />
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <button
                            className="mt-6 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition duration-300 ease-in-out transform hover:scale-105 w-full"
                            onClick={() => setActiveSection('home')}
                        >
                            Volver al Inicio
                        </button>
                    </div>
                );
            case 'actividades':
                return (
                    <div className="p-6 bg-gray-50 rounded-2xl shadow-inner max-w-lg mx-auto text-center">
                        <h2 className="text-3xl font-bold text-gray-800 mb-6">Actividades y Eventos</h2>
                        <p className="text-lg text-gray-600 mb-4">
                            Aquí podrías ver un calendario de actividades o buscar eventos cercanos.
                            (Funcionalidad en desarrollo)
                        </p>
                        <ul className="text-left text-gray-700 space-y-2 mb-6">
                            <li><i className="fas fa-walking mr-2"></i> Caminata en el parque: Lunes 10 AM</li>
                            <li><i className="fas fa-paint-brush mr-2"></i> Taller de pintura: Miércoles 3 PM</li>
                            <li><i className="fas fa-book-reader mr-2"></i> Club de lectura: Viernes 11 AM</li>
                        </ul>
                        <button
                            className="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition duration-300 ease-in-out transform hover:scale-105 w-full"
                            onClick={() => setActiveSection('home')}
                        >
                            Volver al Inicio
                        </button>
                    </div>
                );
            case 'emergencia':
                return (
                    <div className="p-6 bg-gray-50 rounded-2xl shadow-inner max-w-lg mx-auto text-center">
                        <h2 className="text-3xl font-bold text-gray-800 mb-6">Modo de Emergencia</h2>
                        <p className="text-lg text-gray-600 mb-8">
                            Si te encuentras en una situación de emergencia, presiona el botón para contactar a servicios de ayuda.
                        </p>
                        <button
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-110 text-xl"
                            onClick={handleEmergencyCall}
                        >
                            <i className="fas fa-phone-alt mr-3"></i> Llamar a Emergencias
                        </button>
                        <p className="text-md text-gray-500 mt-4">Mantén la calma. La ayuda está en camino.</p>
                        <button
                            className="mt-6 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition duration-300 ease-in-out transform hover:scale-105 w-full"
                            onClick={() => setActiveSection('home')}
                        >
                            Volver al Inicio
                        </button>
                    </div>
                );
            case 'recetas':
                return (
                    <div className="p-6 bg-gray-50 rounded-2xl shadow-inner max-w-lg mx-auto">
                        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Recetas Saludables</h2>
                        {generatedRecipe ? (
                            <div className="bg-white p-6 rounded-xl shadow-md">
                                <h3 className="text-2xl font-semibold text-gray-800 mb-3">{generatedRecipe.recipeName}</h3>
                                <div className="mb-4">
                                    <h4 className="text-xl font-semibold text-gray-700 mb-2">Ingredientes:</h4>
                                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                                        {generatedRecipe.ingredients.map((item, index) => (
                                            <li key={index}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="text-xl font-semibold text-gray-700 mb-2">Instrucciones:</h4>
                                    <ol className="list-decimal list-inside text-gray-600 space-y-1">
                                        {generatedRecipe.instructions.map((item, index) => (
                                            <li key={index}>{item}</li>
                                        ))}
                                    </ol>
                                </div>
                            </div>
                        ) : (
                            <p className="text-lg text-gray-600 text-center">
                                Di "dame una receta" o "qué puedo cocinar con [ingrediente]" para generar una receta.
                            </p>
                        )}
                        <button
                            className="mt-6 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition duration-300 ease-in-out transform hover:scale-105 w-full"
                            onClick={() => { setActiveSection('home'); setGeneratedRecipe(null); }}
                        >
                            Volver al Inicio
                        </button>
                    </div>
                );
            case 'medicamentos':
                return (
                    <div className="p-6 bg-gray-50 rounded-2xl shadow-inner max-w-lg mx-auto">
                        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Solicitud de Medicamentos</h2>
                        <form onSubmit={handleMedicationRequest} className="space-y-4">
                            <div>
                                <label htmlFor="medicationName" className="block text-gray-700 text-lg font-medium mb-2">Nombre del Medicamento:</label>
                                <input
                                    type="text"
                                    id="medicationName"
                                    name="medicationName"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-lg"
                                    placeholder="Ej: Ibuprofeno"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="dosage" className="block text-gray-700 text-lg font-medium mb-2">Dosis:</label>
                                <input
                                    type="text"
                                    id="dosage"
                                    name="dosage"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-lg"
                                    placeholder="Ej: 400 mg"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="frequency" className="block text-gray-700 text-lg font-medium mb-2">Frecuencia:</label>
                                <input
                                    type="text"
                                    id="frequency"
                                    name="frequency"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-lg"
                                    placeholder="Ej: Cada 8 horas"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105 w-full"
                            >
                                Solicitar Medicamento
                            </button>
                        </form>
                        <div className="mt-8">
                            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Solicitudes Registradas:</h3>
                            {medicationRequests.length === 0 ? (
                                <p className="text-gray-600 text-lg">No hay solicitudes de medicamentos registradas.</p>
                            ) : (
                                <ul className="space-y-3">
                                    {medicationRequests.map((req, index) => (
                                        <li key={index} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                            <p className="text-gray-800 text-lg"><span className="font-semibold">Medicamento:</span> {req.medicationName}</p>
                                            <p className="text-gray-600 text-md"><span className="font-semibold">Dosis:</span> {req.dosage}</p>
                                            <p className="text-gray-600 text-md"><span className="font-semibold">Frecuencia:</span> {req.frequency}</p>
                                            <p className="text-gray-600 text-sm italic">Fecha: {req.date}</p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <button
                            className="mt-6 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition duration-300 ease-in-out transform hover:scale-105 w-full"
                            onClick={() => setActiveSection('home')}
                        >
                            Volver al Inicio
                        </button>
                    </div>
                );
            case 'citasMedicas':
                return (
                    <div className="p-6 bg-gray-50 rounded-2xl shadow-inner max-w-lg mx-auto">
                        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Citas Médicas</h2>
                        <form onSubmit={handleAddAppointment} className="space-y-4">
                            <div>
                                <label htmlFor="doctorName" className="block text-gray-700 text-lg font-medium mb-2">Nombre del Doctor:</label>
                                <input
                                    type="text"
                                    id="doctorName"
                                    name="doctorName"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
                                    placeholder="Ej: Dr. Pérez"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="appointmentDate" className="block text-gray-700 text-lg font-medium mb-2">Fecha:</label>
                                <input
                                    type="date"
                                    id="appointmentDate"
                                    name="appointmentDate"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="appointmentTime" className="block text-gray-700 text-lg font-medium mb-2">Hora:</label>
                                <input
                                    type="time"
                                    id="appointmentTime"
                                    name="appointmentTime"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105 w-full"
                            >
                                Agendar Cita
                            </button>
                        </form>
                        <div className="mt-8">
                            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Mis Citas:</h3>
                            {appointments.length === 0 ? (
                                <p className="text-gray-600 text-lg">No hay citas agendadas.</p>
                            ) : (
                                <ul className="space-y-3">
                                    {appointments.map((app) => (
                                        <li key={app.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                            <p className="text-gray-800 text-lg"><span className="font-semibold">Doctor:</span> {app.doctorName}</p>
                                            <p className="text-gray-600 text-md"><span className="font-semibold">Fecha:</span> {app.appointmentDate}</p>
                                            <p className="text-gray-600 text-md"><span className="font-semibold">Hora:</span> {app.appointmentTime}</p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <button
                            className="mt-6 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition duration-300 ease-in-out transform hover:scale-105 w-full"
                            onClick={() => setActiveSection('home')}
                        >
                            Volver al Inicio
                        </button>
                    </div>
                );
            case 'hospitalesCercanos':
                return (
                    <div className="p-6 bg-gray-50 rounded-2xl shadow-inner max-w-lg mx-auto text-center">
                        <h2 className="text-3xl font-bold text-gray-800 mb-6">Hospitales Cercanos</h2>
                        <p className="text-lg text-gray-600 mb-4">
                            Para encontrar hospitales cercanos, necesito tu permiso para acceder a tu ubicación.
                            <br />
                            (Funcionalidad real requiere acceso a geolocalización y una API de mapas)
                        </p>
                        <button
                            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105 w-full"
                            onClick={getNearbyHospitals}
                        >
                            <i className="fas fa-map-marker-alt mr-2"></i> Buscar Hospitales
                        </button>
                        <p className="text-sm text-gray-500 mt-4">
                            Una vez que se realice la búsqueda, la respuesta del asistente te dirá los resultados.
                        </p>
                        <button
                            className="mt-6 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition duration-300 ease-in-out transform hover:scale-105 w-full"
                            onClick={() => setActiveSection('home')}
                        >
                            Volver al Inicio
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 flex flex-col items-center justify-center p-4">
            <h1 className="text-5xl font-extrabold text-blue-800 mb-8 drop-shadow-lg">Senior Connect</h1>

            <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl p-8 mb-8">
                <div className="text-center mb-6">
                    <p className="text-xl text-gray-700 font-medium">Asistente dice:</p>
                    <p className="text-2xl font-semibold text-blue-700 mt-2">{response}</p>
                </div>
                {transcript && (
                    <div className="text-center mb-6 p-4 bg-blue-50 rounded-xl">
                        <p className="text-lg text-gray-600">Dijiste: <span className="font-semibold text-blue-600">{transcript}</span></p>
                    </div>
                )}
                <div className="flex justify-center">
                    <button
                        onClick={toggleListening}
                        className={`p-5 rounded-full shadow-2xl transition-all duration-300 ease-in-out
                        ${listening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-blue-500 hover:bg-blue-600'}
                        text-white flex items-center justify-center transform hover:scale-105`}
                    >
                        <i className={`fas ${listening ? 'fa-stop' : 'fa-microphone'} text-3xl`}></i>
                        <span className="ml-3 text-xl font-bold">{listening ? 'Detener' : 'Hablar'}</span>
                    </button>
                </div>
            </div>

            {/* Contenido dinámico de las secciones */}
            {renderContent()}

            <footer className="mt-12 text-gray-600 text-center text-sm">
                <p>&copy; 2025 Senior Connect. Todos los derechos reservados.</p>
                <p>Desarrollado con ❤️ y tecnología de voz.</p>
            </footer>
        </div>
    );
};

export default App;