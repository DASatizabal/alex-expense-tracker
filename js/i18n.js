// Internationalization (i18n) Module for Alex's Expense Tracker

const I18n = {
    currentLanguage: 'en',

    // Available languages
    LANGUAGES: {
        en: { code: 'en', name: 'English', nativeName: 'English' },
        es: { code: 'es', name: 'Spanish', nativeName: 'Español' },
        ht: { code: 'ht', name: 'Haitian Creole', nativeName: 'Kreyòl Ayisyen' }
    },

    // Translations organized by key category
    translations: {
        en: {
            // App header
            'app.title': "Alex's Expense Tracker",
            'app.subtitle': 'Track expenses, manage payments, reach your goals',

            // Summary section
            'summary.remaining': 'Remaining This Month',
            'summary.nextDue': 'Next Due',
            'summary.allPaid': 'All paid!',
            'summary.today': '(Today!)',
            'summary.overdue': '(Overdue!)',
            'summary.pastDue': '(Past Due!)',
            'summary.inDays_one': '(in {{count}} day)',
            'summary.inDays_other': '(in {{count}} days)',

            // Buttons
            'button.bulkPayment': 'Bulk Payment',
            'button.markAsPaid': 'Mark as Paid',
            'button.addToSavings': 'Add to Savings',
            'button.savePayment': 'Save Payment',
            'button.paySelected': 'Pay Selected',
            'button.unlock': 'Unlock',
            'button.createPassword': 'Create Password',
            'button.cancel': 'Cancel',
            'button.reset': 'Reset',
            'button.export': 'Export',

            // Labels
            'label.amount': 'Amount',
            'label.date': 'Date',
            'label.paymentDate': 'Payment Date',
            'label.notes': 'Notes (optional)',
            'label.password': 'Password',
            'label.confirmPassword': 'Confirm Password',
            'label.selectExpenses': 'Select Expenses to Pay',

            // Placeholders
            'placeholder.notes': 'e.g., Paid to Mom, Paid to David, etc.',
            'placeholder.bulkNotes': 'Paid to Mom, Paid to David, etc.',
            'placeholder.password': 'Enter password',
            'placeholder.confirmPassword': 'Confirm password',

            // Modal titles
            'modal.recordPayment': 'Record Payment',
            'modal.recordPaymentFor': 'Record {{name}} Payment',
            'modal.addToSavings': 'Add to {{name}} Savings',
            'modal.editPayment': 'Edit Payment',
            'modal.editPaymentFor': 'Edit {{name}} Payment',
            'modal.bulkPayment': 'Bulk Payment',
            'modal.unlockApp': 'Unlock App',
            'modal.createPassword': 'Create Password',
            'modal.resetData': 'Reset App Data?',

            // Modal subtitles
            'modal.unlockSubtitle': 'Enter your password to continue',
            'modal.createPasswordSubtitle': 'Set a password to protect your data',
            'modal.resetSubtitle': 'This will delete all local payment data and password. Cloud data (Google Sheets) will remain safe.',

            // Status labels
            'status.paid': 'Paid this month',
            'status.paidPayperiod': 'Paid this payperiod',
            'status.goalReached': 'Goal Reached!',
            'status.paidOff': 'Paid Off!',
            'status.overdue': 'Overdue!',
            'status.pastDue': 'Past Due!',
            'status.dueToday': 'Due today',
            'status.dueSoon_one': 'Due in {{count}} day',
            'status.dueSoon_other': 'Due in {{count}} days',
            'status.daysLeft_one': '{{count}} day left',
            'status.daysLeft_other': '{{count}} days left',
            'status.dueOnThe': 'Due on the {{ordinal}} of month',

            // Sync indicator
            'sync.synced': 'Synced',
            'sync.syncing': 'Syncing...',
            'sync.offline': 'Offline',
            'sync.error': 'Sync Error',
            'sync.unknown': 'Unknown',
            'sync.lastSynced': 'Last synced: {{time}}',

            // Toast notifications
            'toast.paymentSaved': 'Payment saved successfully!',
            'toast.paymentUpdated': 'Payment updated successfully!',
            'toast.paymentDeleted': 'Payment deleted',
            'toast.paymentsFailed': 'Failed to save payment',
            'toast.loadFailed': 'Failed to load data',
            'toast.currencyChanged': 'Currency changed to {{currency}}',
            'toast.languageChanged': 'Language changed to {{language}}',
            'toast.passwordCreated': 'Password created successfully!',
            'toast.welcomeBack': 'Welcome back!',
            'toast.incorrectPassword': 'Incorrect password',
            'toast.noPasswordFound': 'No password found',
            'toast.setupFailed': 'Failed to set up password',
            'toast.passwordTooShort': 'Password must be at least 4 characters',
            'toast.passwordsMismatch': 'Passwords do not match',
            'toast.dataCleared': 'Data cleared. Create a new password.',
            'toast.selectExpense': 'Please select at least one expense',
            'toast.invalidAmount': 'Please enter a valid amount',
            'toast.invalidAmountFor': 'Invalid amount for {{name}}',
            'toast.exceedsBalance': 'Amount exceeds remaining balance ({{amount}})',
            'toast.paymentsExported': 'Payments exported to CSV',
            'toast.bulkPaymentsSaved_one': '{{count}} payment saved!',
            'toast.bulkPaymentsSaved_other': '{{count}} payments saved!',

            // Progress text
            'progress.paymentsOf': '{{current}} of {{total}} payments',
            'progress.savedOf': '{{saved}} of {{total}}',
            'progress.paychecksLeft': '{{count}} paychecks left',
            'progress.perPaycheck': '{{amount}}/paycheck',
            'progress.remaining': '{{amount}} remaining',

            // Expense card text
            'expense.perMonth': '{{amount}}/month',
            'expense.estimated': '~{{amount}}/month',
            'expense.average': 'Avg: {{amount}}',
            'expense.noHistory': 'No history yet',
            'expense.avgHint': 'Last 3-month avg: {{amount}}',
            'expense.estimatedHint': 'Estimated: {{amount}}',
            'expense.trend.up': '↑',
            'expense.trend.down': '↓',
            'expense.trend.stable': '≈',
            'expense.total': '{{amount}} total',
            'expense.dueDate': 'Due: {{date}}',
            'expense.dueDay': 'Due: {{ordinal}} of month',
            'expense.credit': '{{amount}} Credit',
            'expense.pastDue': '{{amount}} Past Due!',
            'status.variableDue': 'Variable - due {{ordinal}}',

            // Payment history
            'history.title': 'Recent Payments',
            'history.noPayments': 'No payments recorded yet',
            'history.editPayment': 'Edit payment',
            'history.deletePayment': 'Delete payment',

            // Confirmation dialogs
            'confirm.deletePayment': 'Are you sure you want to delete this payment?',
            'confirm.forgotPassword': 'Forgot password? Reset app data',

            // Loading
            'loading.text': 'Loading...',

            // CSV export headers
            'csv.date': 'Date',
            'csv.category': 'Category',
            'csv.amount': 'Amount',
            'csv.notes': 'Notes',
            'csv.id': 'ID',

            // Tooltips
            'tooltip.syncStatus': 'Sync status',
            'tooltip.selectCurrency': 'Select currency',
            'tooltip.selectLanguage': 'Select language',
            'tooltip.toggleTheme': 'Toggle theme',
            'tooltip.lockApp': 'Lock App',
            'tooltip.exportCSV': 'Export to CSV',
            'tooltip.settings': 'Settings',

            // Settings
            'settings.title': 'Settings',
            'settings.defaultCurrency': 'Default Currency',
            'settings.currencyHint': 'All expenses are stored in this currency',
            'settings.manageExpenses': 'Manage Expenses',
            'settings.addExpense': 'Add Expense',
            'settings.editExpense': 'Edit Expense',
            'settings.expenseName': 'Name',
            'settings.expenseNamePlaceholder': 'e.g., Rent, Phone, etc.',
            'settings.icon': 'Icon',
            'settings.type': 'Type',
            'settings.typeRecurring': 'Monthly Bill',
            'settings.typeLoan': 'Loan',
            'settings.typeGoal': 'Savings Goal',
            'settings.typeVariable': 'Variable',
            'settings.dueDay': 'Due Day',
            'settings.dueDate': 'Due Date',
            'settings.totalPayments': 'Total Payments',
            'settings.saveExpense': 'Save Expense',
            'settings.deleteExpense': 'Delete',
            'settings.confirmDelete': 'Are you sure you want to delete this expense? This will not delete past payments.',
            'toast.expenseSaved': 'Expense saved successfully!',
            'toast.expenseDeleted': 'Expense deleted',
            'toast.expenseError': 'Failed to save expense',
            'toast.defaultCurrencyChanged': 'Default currency changed to {{currency}}',

            // Bulk payment
            'bulk.allPaid': 'All expenses are paid and current!',
            'bulk.pastDue': '(Past Due)',

            // Ordinals
            'ordinal.st': 'st',
            'ordinal.nd': 'nd',
            'ordinal.rd': 'rd',
            'ordinal.th': 'th',

            // Exchange rates
            'rates.lastUpdated': 'Rates: {{date}}',
            'rates.offline': 'Rates: Cached',
            'rates.unavailable': 'Rates unavailable',
            'toast.ratesFetched': 'Exchange rates updated',
            'toast.ratesFetchFailed': 'Using cached exchange rates',
            'tooltip.rateStatus': 'Exchange rates last updated'
        },

        // Spanish translations
        es: {
            // App header
            'app.title': 'Rastreador de Gastos de Alex',
            'app.subtitle': 'Rastrea gastos, administra pagos, alcanza tus metas',

            // Summary section
            'summary.remaining': 'Restante Este Mes',
            'summary.nextDue': 'Próximo Vencimiento',
            'summary.allPaid': '¡Todo pagado!',
            'summary.today': '(¡Hoy!)',
            'summary.overdue': '(¡Vencido!)',
            'summary.pastDue': '(¡Atrasado!)',
            'summary.inDays_one': '(en {{count}} día)',
            'summary.inDays_other': '(en {{count}} días)',

            // Buttons
            'button.bulkPayment': 'Pago Múltiple',
            'button.markAsPaid': 'Marcar como Pagado',
            'button.addToSavings': 'Agregar a Ahorros',
            'button.savePayment': 'Guardar Pago',
            'button.paySelected': 'Pagar Seleccionados',
            'button.unlock': 'Desbloquear',
            'button.createPassword': 'Crear Contraseña',
            'button.cancel': 'Cancelar',
            'button.reset': 'Restablecer',
            'button.export': 'Exportar',

            // Labels
            'label.amount': 'Monto',
            'label.date': 'Fecha',
            'label.paymentDate': 'Fecha de Pago',
            'label.notes': 'Notas (opcional)',
            'label.password': 'Contraseña',
            'label.confirmPassword': 'Confirmar Contraseña',
            'label.selectExpenses': 'Seleccionar Gastos a Pagar',

            // Placeholders
            'placeholder.notes': 'ej., Pagado a Mamá, Pagado a David, etc.',
            'placeholder.bulkNotes': 'Pagado a Mamá, Pagado a David, etc.',
            'placeholder.password': 'Ingresa contraseña',
            'placeholder.confirmPassword': 'Confirmar contraseña',

            // Modal titles
            'modal.recordPayment': 'Registrar Pago',
            'modal.recordPaymentFor': 'Registrar Pago de {{name}}',
            'modal.addToSavings': 'Agregar a Ahorros de {{name}}',
            'modal.editPayment': 'Editar Pago',
            'modal.editPaymentFor': 'Editar Pago de {{name}}',
            'modal.bulkPayment': 'Pago Múltiple',
            'modal.unlockApp': 'Desbloquear App',
            'modal.createPassword': 'Crear Contraseña',
            'modal.resetData': '¿Restablecer Datos?',

            // Modal subtitles
            'modal.unlockSubtitle': 'Ingresa tu contraseña para continuar',
            'modal.createPasswordSubtitle': 'Establece una contraseña para proteger tus datos',
            'modal.resetSubtitle': 'Esto eliminará todos los datos locales y la contraseña. Los datos en la nube (Google Sheets) permanecerán seguros.',

            // Status labels
            'status.paid': 'Pagado este mes',
            'status.paidPayperiod': 'Pagado este período',
            'status.goalReached': '¡Meta Alcanzada!',
            'status.paidOff': '¡Pagado!',
            'status.overdue': '¡Vencido!',
            'status.pastDue': '¡Atrasado!',
            'status.dueToday': 'Vence hoy',
            'status.dueSoon_one': 'Vence en {{count}} día',
            'status.dueSoon_other': 'Vence en {{count}} días',
            'status.daysLeft_one': '{{count}} día restante',
            'status.daysLeft_other': '{{count}} días restantes',
            'status.dueOnThe': 'Vence el {{ordinal}} del mes',

            // Sync indicator
            'sync.synced': 'Sincronizado',
            'sync.syncing': 'Sincronizando...',
            'sync.offline': 'Sin conexión',
            'sync.error': 'Error de Sync',
            'sync.unknown': 'Desconocido',
            'sync.lastSynced': 'Última sync: {{time}}',

            // Toast notifications
            'toast.paymentSaved': '¡Pago guardado exitosamente!',
            'toast.paymentUpdated': '¡Pago actualizado exitosamente!',
            'toast.paymentDeleted': 'Pago eliminado',
            'toast.paymentsFailed': 'Error al guardar pago',
            'toast.loadFailed': 'Error al cargar datos',
            'toast.currencyChanged': 'Moneda cambiada a {{currency}}',
            'toast.languageChanged': 'Idioma cambiado a {{language}}',
            'toast.passwordCreated': '¡Contraseña creada exitosamente!',
            'toast.welcomeBack': '¡Bienvenido de nuevo!',
            'toast.incorrectPassword': 'Contraseña incorrecta',
            'toast.noPasswordFound': 'No se encontró contraseña',
            'toast.setupFailed': 'Error al configurar contraseña',
            'toast.passwordTooShort': 'La contraseña debe tener al menos 4 caracteres',
            'toast.passwordsMismatch': 'Las contraseñas no coinciden',
            'toast.dataCleared': 'Datos eliminados. Crea una nueva contraseña.',
            'toast.selectExpense': 'Por favor selecciona al menos un gasto',
            'toast.invalidAmount': 'Por favor ingresa un monto válido',
            'toast.invalidAmountFor': 'Monto inválido para {{name}}',
            'toast.exceedsBalance': 'El monto excede el balance restante ({{amount}})',
            'toast.paymentsExported': 'Pagos exportados a CSV',
            'toast.bulkPaymentsSaved_one': '¡{{count}} pago guardado!',
            'toast.bulkPaymentsSaved_other': '¡{{count}} pagos guardados!',

            // Progress text
            'progress.paymentsOf': '{{current}} de {{total}} pagos',
            'progress.savedOf': '{{saved}} de {{total}}',
            'progress.paychecksLeft': '{{count}} cheques restantes',
            'progress.perPaycheck': '{{amount}}/cheque',
            'progress.remaining': '{{amount}} restante',

            // Expense card text
            'expense.perMonth': '{{amount}}/mes',
            'expense.estimated': '~{{amount}}/mes',
            'expense.average': 'Prom: {{amount}}',
            'expense.noHistory': 'Sin historial',
            'expense.avgHint': 'Promedio últimos 3 meses: {{amount}}',
            'expense.estimatedHint': 'Estimado: {{amount}}',
            'expense.trend.up': '↑',
            'expense.trend.down': '↓',
            'expense.trend.stable': '≈',
            'expense.total': '{{amount}} total',
            'expense.dueDate': 'Vence: {{date}}',
            'expense.dueDay': 'Vence: {{ordinal}} del mes',
            'expense.credit': '{{amount}} Crédito',
            'expense.pastDue': '¡{{amount}} Atrasado!',
            'status.variableDue': 'Variable - vence {{ordinal}}',

            // Payment history
            'history.title': 'Pagos Recientes',
            'history.noPayments': 'No hay pagos registrados',
            'history.editPayment': 'Editar pago',
            'history.deletePayment': 'Eliminar pago',

            // Confirmation dialogs
            'confirm.deletePayment': '¿Estás seguro de que deseas eliminar este pago?',
            'confirm.forgotPassword': '¿Olvidaste tu contraseña? Restablecer datos',

            // Loading
            'loading.text': 'Cargando...',

            // CSV export headers
            'csv.date': 'Fecha',
            'csv.category': 'Categoría',
            'csv.amount': 'Monto',
            'csv.notes': 'Notas',
            'csv.id': 'ID',

            // Tooltips
            'tooltip.syncStatus': 'Estado de sincronización',
            'tooltip.selectCurrency': 'Seleccionar moneda',
            'tooltip.selectLanguage': 'Seleccionar idioma',
            'tooltip.toggleTheme': 'Cambiar tema',
            'tooltip.lockApp': 'Bloquear App',
            'tooltip.exportCSV': 'Exportar a CSV',
            'tooltip.settings': 'Configuración',

            // Settings
            'settings.title': 'Configuración',
            'settings.defaultCurrency': 'Moneda Predeterminada',
            'settings.currencyHint': 'Todos los gastos se guardan en esta moneda',
            'settings.manageExpenses': 'Administrar Gastos',
            'settings.addExpense': 'Agregar Gasto',
            'settings.editExpense': 'Editar Gasto',
            'settings.expenseName': 'Nombre',
            'settings.expenseNamePlaceholder': 'ej., Alquiler, Teléfono, etc.',
            'settings.icon': 'Ícono',
            'settings.type': 'Tipo',
            'settings.typeRecurring': 'Factura Mensual',
            'settings.typeLoan': 'Préstamo',
            'settings.typeGoal': 'Meta de Ahorro',
            'settings.typeVariable': 'Variable',
            'settings.dueDay': 'Día de Vencimiento',
            'settings.dueDate': 'Fecha de Vencimiento',
            'settings.totalPayments': 'Total de Pagos',
            'settings.saveExpense': 'Guardar Gasto',
            'settings.deleteExpense': 'Eliminar',
            'settings.confirmDelete': '¿Estás seguro de que deseas eliminar este gasto? Esto no eliminará los pagos anteriores.',
            'toast.expenseSaved': '¡Gasto guardado exitosamente!',
            'toast.expenseDeleted': 'Gasto eliminado',
            'toast.expenseError': 'Error al guardar gasto',
            'toast.defaultCurrencyChanged': 'Moneda predeterminada cambiada a {{currency}}',

            // Bulk payment
            'bulk.allPaid': '¡Todos los gastos están pagados y al día!',
            'bulk.pastDue': '(Atrasado)',

            // Ordinals (Spanish uses º for all)
            'ordinal.st': 'º',
            'ordinal.nd': 'º',
            'ordinal.rd': 'º',
            'ordinal.th': 'º',

            // Exchange rates
            'rates.lastUpdated': 'Tasas: {{date}}',
            'rates.offline': 'Tasas: En caché',
            'rates.unavailable': 'Tasas no disponibles',
            'toast.ratesFetched': 'Tasas de cambio actualizadas',
            'toast.ratesFetchFailed': 'Usando tasas de cambio en caché',
            'tooltip.rateStatus': 'Última actualización de tasas'
        },

        // Haitian Creole translations
        ht: {
            // App header
            'app.title': 'Trackè Depans Alex',
            'app.subtitle': 'Swiv depans, jere peman, atenn objektif ou',

            // Summary section
            'summary.remaining': 'Rès Mwa Sa',
            'summary.nextDue': 'Pwochen Dèt',
            'summary.allPaid': 'Tout peye!',
            'summary.today': '(Jodi a!)',
            'summary.overdue': '(An reta!)',
            'summary.pastDue': '(An reta!)',
            'summary.inDays_one': '(nan {{count}} jou)',
            'summary.inDays_other': '(nan {{count}} jou)',

            // Buttons
            'button.bulkPayment': 'Peman Miltip',
            'button.markAsPaid': 'Make kòm Peye',
            'button.addToSavings': 'Ajoute nan Epay',
            'button.savePayment': 'Anrejistre Peman',
            'button.paySelected': 'Peye Seleksyon',
            'button.unlock': 'Debloке',
            'button.createPassword': 'Kreye Modpas',
            'button.cancel': 'Anile',
            'button.reset': 'Reyinisyalize',
            'button.export': 'Ekspòte',

            // Labels
            'label.amount': 'Montan',
            'label.date': 'Dat',
            'label.paymentDate': 'Dat Peman',
            'label.notes': 'Nòt (opsyonèl)',
            'label.password': 'Modpas',
            'label.confirmPassword': 'Konfime Modpas',
            'label.selectExpenses': 'Chwazi Depans pou Peye',

            // Placeholders
            'placeholder.notes': 'egzanp, Peye Manman, Peye David, elatriye.',
            'placeholder.bulkNotes': 'Peye Manman, Peye David, elatriye.',
            'placeholder.password': 'Antre modpas',
            'placeholder.confirmPassword': 'Konfime modpas',

            // Modal titles
            'modal.recordPayment': 'Anrejistre Peman',
            'modal.recordPaymentFor': 'Anrejistre Peman {{name}}',
            'modal.addToSavings': 'Ajoute nan Epay {{name}}',
            'modal.editPayment': 'Modifye Peman',
            'modal.editPaymentFor': 'Modifye Peman {{name}}',
            'modal.bulkPayment': 'Peman Miltip',
            'modal.unlockApp': 'Debloке App',
            'modal.createPassword': 'Kreye Modpas',
            'modal.resetData': 'Reyinisyalize Done?',

            // Modal subtitles
            'modal.unlockSubtitle': 'Antre modpas ou pou kontinye',
            'modal.createPasswordSubtitle': 'Mete yon modpas pou pwoteje done ou',
            'modal.resetSubtitle': 'Sa ap efase tout done lokal ak modpas. Done nan nyaj (Google Sheets) ap rete an sekirite.',

            // Status labels
            'status.paid': 'Peye mwa sa',
            'status.paidPayperiod': 'Peye peryòd sa',
            'status.goalReached': 'Objektif Atenn!',
            'status.paidOff': 'Fin Peye!',
            'status.overdue': 'An Reta!',
            'status.pastDue': 'An Reta!',
            'status.dueToday': 'Dwe jodi a',
            'status.dueSoon_one': 'Dwe nan {{count}} jou',
            'status.dueSoon_other': 'Dwe nan {{count}} jou',
            'status.daysLeft_one': '{{count}} jou rete',
            'status.daysLeft_other': '{{count}} jou rete',
            'status.dueOnThe': 'Dwe {{ordinal}} nan mwa',

            // Sync indicator
            'sync.synced': 'Senkronize',
            'sync.syncing': 'Ap senkronize...',
            'sync.offline': 'Pa gen koneksyon',
            'sync.error': 'Erè Sync',
            'sync.unknown': 'Enkoni',
            'sync.lastSynced': 'Dènye sync: {{time}}',

            // Toast notifications
            'toast.paymentSaved': 'Peman anrejistre avèk siksè!',
            'toast.paymentUpdated': 'Peman mete ajou avèk siksè!',
            'toast.paymentDeleted': 'Peman efase',
            'toast.paymentsFailed': 'Echèk anrejistreman peman',
            'toast.loadFailed': 'Echèk chajman done',
            'toast.currencyChanged': 'Lajan chanje a {{currency}}',
            'toast.languageChanged': 'Lang chanje a {{language}}',
            'toast.passwordCreated': 'Modpas kreye avèk siksè!',
            'toast.welcomeBack': 'Byenveni ankò!',
            'toast.incorrectPassword': 'Modpas pa kòrèk',
            'toast.noPasswordFound': 'Pa jwenn modpas',
            'toast.setupFailed': 'Echèk konfigirasyon modpas',
            'toast.passwordTooShort': 'Modpas dwe gen omwen 4 karaktè',
            'toast.passwordsMismatch': 'Modpas yo pa menm',
            'toast.dataCleared': 'Done efase. Kreye yon nouvo modpas.',
            'toast.selectExpense': 'Tanpri chwazi omwen yon depans',
            'toast.invalidAmount': 'Tanpri antre yon montan valab',
            'toast.invalidAmountFor': 'Montan pa valab pou {{name}}',
            'toast.exceedsBalance': 'Montan depase balans ki rete ({{amount}})',
            'toast.paymentsExported': 'Peman ekspòte nan CSV',
            'toast.bulkPaymentsSaved_one': '{{count}} peman anrejistre!',
            'toast.bulkPaymentsSaved_other': '{{count}} peman anrejistre!',

            // Progress text
            'progress.paymentsOf': '{{current}} nan {{total}} peman',
            'progress.savedOf': '{{saved}} nan {{total}}',
            'progress.paychecksLeft': '{{count}} chèk rete',
            'progress.perPaycheck': '{{amount}}/chèk',
            'progress.remaining': '{{amount}} rete',

            // Expense card text
            'expense.perMonth': '{{amount}}/mwa',
            'expense.estimated': '~{{amount}}/mwa',
            'expense.average': 'Mwayèn: {{amount}}',
            'expense.noHistory': 'Pa gen istwa toujou',
            'expense.avgHint': 'Mwayèn 3 dènye mwa: {{amount}}',
            'expense.estimatedHint': 'Estimasyon: {{amount}}',
            'expense.trend.up': '↑',
            'expense.trend.down': '↓',
            'expense.trend.stable': '≈',
            'expense.total': '{{amount}} total',
            'expense.dueDate': 'Dwe: {{date}}',
            'expense.dueDay': 'Dwe: {{ordinal}} nan mwa',
            'expense.credit': '{{amount}} Kredi',
            'expense.pastDue': '{{amount}} An Reta!',
            'status.variableDue': 'Varyab - dwe {{ordinal}}',

            // Payment history
            'history.title': 'Peman Resan',
            'history.noPayments': 'Pa gen peman anrejistre toujou',
            'history.editPayment': 'Modifye peman',
            'history.deletePayment': 'Efase peman',

            // Confirmation dialogs
            'confirm.deletePayment': 'Èske ou sèten ou vle efase peman sa a?',
            'confirm.forgotPassword': 'Bliye modpas? Reyinisyalize done',

            // Loading
            'loading.text': 'Ap chaje...',

            // CSV export headers
            'csv.date': 'Dat',
            'csv.category': 'Kategori',
            'csv.amount': 'Montan',
            'csv.notes': 'Nòt',
            'csv.id': 'ID',

            // Tooltips
            'tooltip.syncStatus': 'Estati senkronizasyon',
            'tooltip.selectCurrency': 'Chwazi lajan',
            'tooltip.selectLanguage': 'Chwazi lang',
            'tooltip.toggleTheme': 'Chanje tèm',
            'tooltip.lockApp': 'Bloke App',
            'tooltip.exportCSV': 'Ekspòte nan CSV',
            'tooltip.settings': 'Paramèt',

            // Settings
            'settings.title': 'Paramèt',
            'settings.defaultCurrency': 'Lajan Pa Defo',
            'settings.currencyHint': 'Tout depans anrejistre nan lajan sa a',
            'settings.manageExpenses': 'Jere Depans',
            'settings.addExpense': 'Ajoute Depans',
            'settings.editExpense': 'Modifye Depans',
            'settings.expenseName': 'Non',
            'settings.expenseNamePlaceholder': 'egzanp, Lwaye, Telefòn, elatriye.',
            'settings.icon': 'Ikòn',
            'settings.type': 'Tip',
            'settings.typeRecurring': 'Bòdwo Chak Mwa',
            'settings.typeLoan': 'Prè',
            'settings.typeGoal': 'Objektif Epay',
            'settings.typeVariable': 'Varyab',
            'settings.dueDay': 'Jou Dèt',
            'settings.dueDate': 'Dat Dèt',
            'settings.totalPayments': 'Total Peman',
            'settings.saveExpense': 'Anrejistre Depans',
            'settings.deleteExpense': 'Efase',
            'settings.confirmDelete': 'Èske ou sèten ou vle efase depans sa a? Sa pa pral efase peman ki deja fèt.',
            'toast.expenseSaved': 'Depans anrejistre avèk siksè!',
            'toast.expenseDeleted': 'Depans efase',
            'toast.expenseError': 'Echèk anrejistreman depans',
            'toast.defaultCurrencyChanged': 'Lajan pa defo chanje a {{currency}}',

            // Bulk payment
            'bulk.allPaid': 'Tout depans peye e ajou!',
            'bulk.pastDue': '(An Reta)',

            // Ordinals (Haitian Creole uses yèm/ye for ordinals)
            'ordinal.st': 'ye',
            'ordinal.nd': 'yèm',
            'ordinal.rd': 'yèm',
            'ordinal.th': 'yèm',

            // Exchange rates
            'rates.lastUpdated': 'To: {{date}}',
            'rates.offline': 'To: Anrejistreman',
            'rates.unavailable': 'To pa disponib',
            'toast.ratesFetched': 'To echanj mete ajou',
            'toast.ratesFetchFailed': 'Sèvi ak to echanj anrejistre',
            'tooltip.rateStatus': 'Dènye miz ajou to echanj'
        }
    },

    /**
     * Initialize i18n - load saved language or detect from browser
     */
    init() {
        const savedLanguage = localStorage.getItem('alex_expense_language');
        if (savedLanguage && this.LANGUAGES[savedLanguage]) {
            this.currentLanguage = savedLanguage;
        } else {
            // Auto-detect from browser
            const browserLang = navigator.language.split('-')[0];
            if (this.LANGUAGES[browserLang]) {
                this.currentLanguage = browserLang;
            }
        }
    },

    /**
     * Set the current language
     * @param {string} code - Language code (e.g., 'en', 'es')
     */
    setLanguage(code) {
        if (this.LANGUAGES[code]) {
            this.currentLanguage = code;
            localStorage.setItem('alex_expense_language', code);
            this.translatePage();
            return true;
        }
        return false;
    },

    /**
     * Get a translation by key with optional parameter interpolation
     * @param {string} key - Translation key (e.g., 'toast.paymentSaved')
     * @param {Object} params - Parameters for interpolation (e.g., {name: 'Rent'})
     * @returns {string} - Translated string or key if not found
     */
    t(key, params = {}) {
        const translations = this.translations[this.currentLanguage] || this.translations.en;
        let text = translations[key];

        if (text === undefined) {
            console.warn(`Missing translation: ${key}`);
            return key;
        }

        // Interpolate parameters: {{name}} -> value
        Object.keys(params).forEach(param => {
            text = text.replace(new RegExp(`{{${param}}}`, 'g'), params[param]);
        });

        return text;
    },

    /**
     * Get a pluralized translation
     * @param {string} key - Base translation key (e.g., 'status.daysLeft')
     * @param {number} count - The count for pluralization
     * @param {Object} params - Additional parameters
     * @returns {string} - Pluralized translated string
     */
    plural(key, count, params = {}) {
        // Determine suffix based on count (English rules: 1 = _one, else = _other)
        const suffix = count === 1 ? '_one' : '_other';
        const pluralKey = key + suffix;

        return this.t(pluralKey, { count, ...params });
    },

    /**
     * Translate all elements with data-i18n attributes
     */
    translatePage() {
        // Translate text content
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = this.t(key);
        });

        // Translate placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = this.t(key);
        });

        // Translate titles (tooltips)
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            el.title = this.t(key);
        });

        // Update HTML lang attribute
        document.documentElement.lang = this.currentLanguage;
    },

    /**
     * Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
     * @param {number} n - The number
     * @returns {string} - Number with ordinal suffix
     */
    getOrdinal(n) {
        const s = [
            this.t('ordinal.th'),
            this.t('ordinal.st'),
            this.t('ordinal.nd'),
            this.t('ordinal.rd')
        ];
        const v = n % 100;
        const suffix = s[(v - 20) % 10] || s[v] || s[0];
        return n + suffix;
    },

    /**
     * Get list of available languages for selector
     * @returns {Array} - Array of {code, name, nativeName}
     */
    getAvailableLanguages() {
        return Object.values(this.LANGUAGES);
    }
};
