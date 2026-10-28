// Drag cards between columns; double-click to delete. 
(() => {
    let draggedCard = null;

    // Enable dragging and double-clicking on the card.
    function bindCard(card) {
        if (card.dataset.dragBound) return;

        card.dataset.dragBound = 'true';
        card.draggable = true;

        card.addEventListener('dblclick', event => {
            event.preventDefault();
            event.stopPropagation();
            card.remove();
            window.KanbanStorage?.save();
        });

        card.addEventListener('dragstart', event => {
            draggedCard = card;
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', card.dataset.cardId || '');

            requestAnimationFrame(() => {
                card.classList.add('dragging');
            });
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
            clearColumnHighlights();
            draggedCard = null;
            window.KanbanStorage?.save();
        });
    }

    // Remove the column highlights.
    function clearColumnHighlights() {
        document.querySelectorAll('.kanban-cards').forEach(column => {
            column.classList.remove('card-hover');
        });
    }

    // Allow cards to be dropped into the column.
    function bindColumn(column) {
        if (column.dataset.dropBound) return;

        column.dataset.dropBound = 'true';

        column.addEventListener('dragover', event => {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            column.classList.add('card-hover');
        });

        column.addEventListener('dragleave', event => {
            if (!column.contains(event.relatedTarget)) {
                column.classList.remove('card-hover');
            }
        });

        column.addEventListener('drop', event => {
            event.preventDefault();
            column.classList.remove('card-hover');

            const card = draggedCard || document.querySelector('.kanban-card.dragging');

            if (!card) return;

            column.appendChild(card);
            window.KanbanStorage?.save();
        });
    }

    document.querySelectorAll('.kanban-card').forEach(bindCard);
    document.querySelectorAll('.kanban-cards').forEach(bindColumn);

    window.KanbanDragDrop = { bindCard };
})();

