// Save and restore cards. localStorage persists the data; sessionStorage stores the active column for this tab. 
(() => {
    const BOARD_KEY = 'kanban-board-v1';
    const ACTIVE_COLUMN_KEY = 'kanban-active-column';

    // Gather card data to save.
    function snapshot() {
        return Array.from(document.querySelectorAll('.kanban-column')).map(column => ({
            id: column.dataset.id,
            cards: Array.from(column.querySelectorAll('.kanban-card')).map(card => ({
                id: card.dataset.cardId || `card-${Math.random().toString(16).slice(2)}`,
                title: card.querySelector('.card-title')?.textContent.trim() || 'New task',
                priority: getPriority(card),
                comments: card._comments || []
            }))
        }));
    }

    // Get the card priority.
    function getPriority(card) {
        const badge = card.querySelector('.badge');

        if (badge?.classList.contains('high')) return 'high';
        if (badge?.classList.contains('medium')) return 'medium';

        return 'low';
    }

    // Save the board in the browser.
    function save() {
        try {
            localStorage.setItem(BOARD_KEY, JSON.stringify(snapshot()));
        } catch (error) {
            console.warn('Could not save the Kanban board to localStorage.', error);
        }
    }

    // Load saved cards when the page opens.
    function restore() {
        let saved;

        try {
            saved = JSON.parse(localStorage.getItem(BOARD_KEY) || 'null');
        } catch {
            return;
        }

        if (!Array.isArray(saved)) return;

        saved.forEach(savedColumn => {
            const selector = `.kanban-column[data-id="${CSS.escape(String(savedColumn.id))}"] .kanban-cards`;
            const list = document.querySelector(selector);

            if (!list || !Array.isArray(savedColumn.cards)) return;

            list.replaceChildren();

            savedColumn.cards.forEach(item => {
                const card = createSavedCard(item);
                list.append(card);
                window.KanbanDragDrop?.bindCard(card);
            });
        });
    }

    // Build a card from saved data.
    function createSavedCard(item) {
        const card = document.createElement('article');
        const priority = ['low', 'medium', 'high'].includes(item.priority)
            ? item.priority
            : 'low';

        card.className = 'kanban-card';
        card.dataset.cardId = item.id;
        card.draggable = true;
        card._comments = Array.isArray(item.comments) ? item.comments : [];

        const badge = document.createElement('div');
        badge.className = `badge ${priority}`;

        const priorityLabels = {
            low: 'low priority',
            medium: 'medium priority',
            high: 'high priority'
        };

        const label = document.createElement('span');
        label.textContent = priorityLabels[priority];
        badge.append(label);

        const title = document.createElement('p');
        title.className = 'card-title';
        title.textContent = item.title || 'New task';

        const info = document.createElement('div');
        info.className = 'card-infos';

        const icons = document.createElement('div');
        icons.className = 'card-icons';

        const commentButton = document.createElement('button');
        commentButton.type = 'button';
        commentButton.className = 'comment-toggle';
        commentButton.setAttribute('aria-label', 'View comments');
        commentButton.innerHTML = `<i class="fa-regular fa-comment" aria-hidden="true"></i> ${card._comments.length}`;

        icons.append(commentButton);
        info.append(icons);
        card.append(badge, title, info);

        return card;
    }

    window.KanbanStorage = { save, snapshot };

    restore();
    save();

    // Store the last column clicked in this tab.
    document.querySelectorAll('.kanban-column').forEach(column => {
        column.addEventListener('click', event => {
            if (event.target.closest('button')) return;

            try {
                sessionStorage.setItem(ACTIVE_COLUMN_KEY, column.dataset.id);
            } catch {
                // If the browser blocks storage, continue without saving.
            }
        });
    });

    document.addEventListener('change', save);

    document.addEventListener('click', event => {
        if (event.target.closest('.add-card-btn')) {
            setTimeout(save, 0);
        }
    });
})();

