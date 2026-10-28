// Create cards and handle priorities and comments. 
(() => {
    // Build a new card with a title and priority.
    function createCard(title, priority) {
        const card = document.createElement('article');
        card.className = 'kanban-card';
        card.dataset.cardId = `card-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        card.draggable = true;
        card._comments = [];

        const badge = document.createElement('div');
        badge.className = `badge ${priority}`;

        const priorityNames = {
            low: 'baixa',
            medium: 'média',
            high: 'alta'
        };

        const badgeText = document.createElement('span');
        badgeText.textContent = `${priorityNames[priority]} prioridade`;
        badge.append(badgeText);

        const titleElement = document.createElement('p');
        titleElement.className = 'card-title';
        titleElement.textContent = title;

        const info = document.createElement('div');
        info.className = 'card-infos';

        const icons = document.createElement('div');
        icons.className = 'card-icons';

        const commentButton = document.createElement('button');
        commentButton.type = 'button';
        commentButton.className = 'comment-toggle';
        commentButton.setAttribute('aria-label', 'Ver comentários');
        commentButton.innerHTML = '<i class="fa-regular fa-comment" aria-hidden="true"></i> 0';

        icons.append(commentButton);
        info.append(icons);
        card.append(badge, titleElement, info);

        return card;
    }

    const commentsDialog = document.createElement('dialog');
    commentsDialog.className = 'comments-dialog';
    commentsDialog.innerHTML = `
        <form class="comments-form">
            <h2 class="comments-title">Comentários</h2>
            <ul class="comments-list"></ul>
            <p class="comments-empty">Ainda não há comentários neste cartão.</p>

            <label>
                Novo comentário
                <textarea
                    name="comment"
                    rows="3"
                    maxlength="500"
                    required
                    placeholder="Escreva um comentário"
                ></textarea>
            </label>

            <div class="new-card-actions">
                <button type="button" class="close-comments">Fechar</button>
                <button type="submit">Adicionar comentário</button>
            </div>
        </form>`;
    document.body.append(commentsDialog);

    let activeCard = null;

    const commentsForm = commentsDialog.querySelector('.comments-form');
    const commentsList = commentsDialog.querySelector('.comments-list');
    const commentsEmpty = commentsDialog.querySelector('.comments-empty');
    const commentsTitle = commentsDialog.querySelector('.comments-title');

    // Update the comment list and count.
    function renderComments(card) {
        const comments = card._comments || [];
        const button = card.querySelector('.comment-toggle');

        if (button) {
            button.innerHTML = `<i class="fa-regular fa-comment" aria-hidden="true"></i> ${comments.length}`;
            button.setAttribute('aria-label', `Ver ${comments.length} comentários`);
        }

        commentsList.replaceChildren();

        comments.forEach(text => {
            const item = document.createElement('li');
            item.textContent = text;
            commentsList.append(item);
        });

        commentsEmpty.hidden = comments.length > 0;
    }

    // Open the dialog when the comment icon is clicked.
    function bindComments(card) {
        card._comments = Array.isArray(card._comments) ? card._comments : [];

        const oldCounter = card.querySelector('.card-icons p');
        let button = card.querySelector('.comment-toggle');

        if (!button && oldCounter) {
            button = document.createElement('button');
            button.type = 'button';
            button.className = 'comment-toggle';
            button.innerHTML = '<i class="fa-regular fa-comment" aria-hidden="true"></i> 0';
            oldCounter.replaceWith(button);
        }

        button?.addEventListener('click', () => {
            activeCard = card;
            commentsTitle.textContent = `Comentários: ${card.querySelector('.card-title')?.textContent || 'Cartão'}`;
            renderComments(card);
            commentsDialog.showModal();
        });

        button?.addEventListener('dblclick', event => {
            event.stopPropagation();
        });

        renderComments(card);
    }

    // Set up cards that already exist or were loaded from storage.
    document.querySelectorAll('.kanban-card').forEach(bindComments);

    commentsDialog.querySelector('.close-comments').addEventListener('click', () => {
        commentsDialog.close();
    });

    // Add the comment and save the board.
    commentsForm.addEventListener('submit', event => {
        event.preventDefault();

        const text = commentsForm.elements.comment.value.trim();

        if (!text || !activeCard) return;

        activeCard._comments.push(text);
        renderComments(activeCard);
        window.KanbanStorage?.save();
        commentsForm.reset();
    });

    const newCardDialog = document.createElement('dialog');
    newCardDialog.innerHTML = `
        <form method="dialog" class="new-card-form">
            <h2>Novo cartão</h2>

            <label>
                Tarefa
                <input
                    name="title"
                    type="text"
                    required
                    maxlength="120"
                    placeholder="Ex.: Revisar documento"
                >
            </label>

            <label>
                Prioridade
                <select name="priority">
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                </select>
            </label>

            <div class="new-card-actions">
                <button type="button" class="cancel-new-card">Cancelar</button>
                <button type="submit">Criar cartão</button>
            </div>
        </form>`;
    document.body.append(newCardDialog);

    let targetColumn = null;

    const newCardForm = newCardDialog.querySelector('.new-card-form');
    const titleInput = newCardForm.elements.title;

    newCardDialog.querySelector('.cancel-new-card').addEventListener('click', () => {
        newCardDialog.close();
    });

    // Create the card in the selected column and save the board.
    newCardForm.addEventListener('submit', event => {
        event.preventDefault();

        const title = titleInput.value.trim();

        if (!title || !targetColumn) return;

        const card = createCard(title, newCardForm.elements.priority.value);
        targetColumn.querySelector('.kanban-cards').append(card);

        window.KanbanDragDrop?.bindCard(card);
        bindComments(card);
        window.KanbanStorage?.save();

        newCardDialog.close();
        newCardForm.reset();
    });

    // Open the form for the column whose + button was clicked.
    document.querySelectorAll('.add-card-btn').forEach(button => {
        button.addEventListener('click', () => {
            targetColumn = button.closest('.kanban-column');
            newCardDialog.showModal();
            titleInput.focus();
        });
    });
})();

