/**
 * SortableTable - Safari Compatible Version
 * A reusable, configurable sortable table with pagination
 * This version uses function constructor pattern for better Safari compatibility
 */
(function() {
    'use strict';

    function SortableTable(options) {
        // Validate required options
        if (!options || typeof options !== 'object') {
            throw new Error('Options object is required');
        }
        if (!options.container) {
            throw new Error('Container element or selector is required');
        }
        if (!options.data || !Array.isArray(options.data)) {
            throw new Error('Data array is required');
        }
        if (!options.columns || !Array.isArray(options.columns)) {
            throw new Error('Columns array is required');
        }

        // Set up configuration with defaults
        this.container = typeof options.container === 'string' 
            ? document.querySelector(options.container)
            : options.container;
        
        if (!this.container) {
            throw new Error('Container element not found');
        }

        this.data = options.data.slice(); // Create a copy to avoid mutating original
        this.originalData = options.data.slice(); // Keep original for filtering
        this.columns = options.columns;
        this.rowsPerPage = options.rowsPerPage || 25;
        this.showPagination = options.showPagination !== false;
        this.allowSorting = options.allowSorting !== false;
        this.cssPrefix = options.cssPrefix || 'sortable-table';
        this.emptyMessage = options.emptyMessage || 'No data available';
        
        // Pagination state
        this.currentPage = 1;
        this.totalPages = Math.ceil(this.data.length / this.rowsPerPage);
        
        // Sorting state
        this.currentSort = { 
            column: null, 
            direction: 'asc' 
        };

        // Event callbacks
        this.onSort = options.onSort || null;
        this.onPageChange = options.onPageChange || null;
        this.onRowClick = options.onRowClick || null;

        // Initialize
        this.init();
    }

    // Add methods to prototype for better Safari compatibility
    SortableTable.prototype.init = function() {
        this.container.className = this.cssPrefix + '-container';
        this.render();
    };

    SortableTable.prototype.render = function() {
        this.container.innerHTML = this.generateHTML();
        this.updatePaginationState();
        this.updateSortIndicators();
        this.attachEventListeners();
    };

    SortableTable.prototype.generateHTML = function() {
        return (this.showPagination ? this.generatePaginationHTML() : '') +
            '<div class="' + this.cssPrefix + '-wrapper">' +
                '<table class="' + this.cssPrefix + '">' +
                    '<thead class="' + this.cssPrefix + '-head">' +
                        '<tr>' + this.generateHeaderHTML() + '</tr>' +
                    '</thead>' +
                    '<tbody class="' + this.cssPrefix + '-body">' +
                        this.generateBodyHTML() +
                    '</tbody>' +
                '</table>' +
            '</div>';
    };

    SortableTable.prototype.generatePaginationHTML = function() {
        return '<div class="' + this.cssPrefix + '-controls">' +
            '<div class="' + this.cssPrefix + '-pagination">' +
                '<button class="first-page" data-action="first">&lt;&lt;</button>' +
                '<button class="prev-page" data-action="prev">&lt;</button>' +
                '<span class="page-info">' +
                    'Page <span class="current-page-number">' + this.currentPage + '</span> ' +
                    'of <span class="total-pages">' + this.totalPages + '</span>' +
                '</span>' +
                '<button class="next-page" data-action="next">&gt;</button>' +
                '<button class="last-page" data-action="last">&gt;&gt;</button>' +
            '</div>' +
        '</div>';
    };

    SortableTable.prototype.generateHeaderHTML = function() {
        var self = this;
        return this.columns.map(function(col, index) {
            var sortable = self.allowSorting && col.sortable !== false;
            var classes = [
                self.cssPrefix + '-header',
                sortable ? 'sortable' : '',
                (col.type === 'number' || col.type === 'date') ? 'numeric' : '',
                col.className || ''
            ].filter(Boolean).join(' ');

            return '<th class="' + classes + '" ' +
                'data-column="' + col.key + '" ' +
                'data-index="' + index + '" ' +
                'data-type="' + (col.type || 'string') + '"' +
                (col.width ? ' style="width: ' + col.width + '"' : '') + '>' +
                col.label +
                (sortable ? '<span class="sort-indicator">↕</span>' : '') +
            '</th>';
        }).join('');
    };

    SortableTable.prototype.generateBodyHTML = function() {
        var self = this;
        if (this.data.length === 0) {
            return '<tr>' +
                '<td colspan="' + this.columns.length + '" class="' + this.cssPrefix + '-empty">' +
                    this.emptyMessage +
                '</td>' +
            '</tr>';
        }

        var startIndex = (this.currentPage - 1) * this.rowsPerPage;
        var endIndex = Math.min(startIndex + this.rowsPerPage, this.data.length);
        var pageData = this.data.slice(startIndex, endIndex);

        return pageData.map(function(row, rowIndex) {
            var actualIndex = startIndex + rowIndex;
            return '<tr class="' + self.cssPrefix + '-row" data-index="' + actualIndex + '">' +
                self.columns.map(function(col, colIndex) {
                    var value = row[colIndex] != null ? row[colIndex] : '';
                    var formatted = self.formatCellValue(value, col);
                    var classes = [
                        self.cssPrefix + '-cell',
                        (col.type === 'number' || col.type === 'date') ? 'numeric' : '',
                        col.cellClassName || ''
                    ].filter(Boolean).join(' ');

                    return '<td class="' + classes + '" data-column="' + col.key + '">' + formatted + '</td>';
                }).join('') +
            '</tr>';
        }).join('');
    };

    SortableTable.prototype.formatCellValue = function(value, column) {
        if (column.formatter && typeof column.formatter === 'function') {
            return column.formatter(value);
        }

        switch (column.type) {
            case 'number':
                return typeof value === 'number' ? value.toLocaleString() : value;
            case 'date':
                return value instanceof Date ? value.toLocaleDateString() : value;
            case 'boolean':
                return value ? 'Yes' : 'No';
            default:
                return String(value);
        }
    };

    SortableTable.prototype.attachEventListeners = function() {
        // Pagination controls
        if (this.showPagination) {
            this.attachPaginationListeners();
        }

        // Column sorting
        if (this.allowSorting) {
            this.attachSortingListeners();
        }

        // Row clicks
        if (this.onRowClick) {
            this.attachRowClickListeners();
        }
    };

    SortableTable.prototype.attachPaginationListeners = function() {
        var self = this;
        var pagination = this.container.querySelector('.' + this.cssPrefix + '-pagination');
        if (!pagination) return;

        // Navigation buttons
        pagination.addEventListener('click', function(e) {
            if (e.target.matches && e.target.matches('button[data-action]')) {
                var action = e.target.getAttribute('data-action');
                self.handlePaginationAction(action);
            }
        });

        // Page number click to edit
        var pageNumber = pagination.querySelector('.current-page-number');
        if (pageNumber) {
            pageNumber.addEventListener('click', function(e) {
                self.makePageNumberEditable(e.target);
            });
        }
    };

    SortableTable.prototype.makePageNumberEditable = function(element) {
        var self = this;
        var input = document.createElement('input');
        input.type = 'number';
        input.min = '1';
        input.max = this.totalPages.toString();
        input.value = this.currentPage.toString();
        input.className = 'page-number-input';
        input.style.width = '50px';
        input.style.textAlign = 'center';

        var finishEdit = function() {
            var newPage = parseInt(input.value);
            if (newPage >= 1 && newPage <= self.totalPages && newPage !== self.currentPage) {
                self.goToPage(newPage);
            }
            // Restore the span
            var newSpan = document.createElement('span');
            newSpan.className = 'current-page-number';
            newSpan.textContent = self.currentPage.toString();
            newSpan.addEventListener('click', function(e) { 
                self.makePageNumberEditable(e.target); 
            });
            input.parentNode.replaceChild(newSpan, input);
        };

        input.addEventListener('blur', finishEdit);
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                finishEdit();
            } else if (e.key === 'Escape' || e.keyCode === 27) {
                // Cancel edit
                var newSpan = document.createElement('span');
                newSpan.className = 'current-page-number';
                newSpan.textContent = self.currentPage.toString();
                newSpan.addEventListener('click', function(e) { 
                    self.makePageNumberEditable(e.target); 
                });
                input.parentNode.replaceChild(newSpan, input);
            }
        });

        element.parentNode.replaceChild(input, element);
        input.focus();
        input.select();
    };

    SortableTable.prototype.attachSortingListeners = function() {
        var self = this;
        var headers = this.container.querySelectorAll('th.sortable');
        for (var i = 0; i < headers.length; i++) {
            headers[i].addEventListener('click', function() {
                var column = this.getAttribute('data-column');
                var type = this.getAttribute('data-type');
                var index = parseInt(this.getAttribute('data-index'));
                self.sort(column, type, index);
            });
        }
    };

    SortableTable.prototype.attachRowClickListeners = function() {
        var self = this;
        var tbody = this.container.querySelector('.' + this.cssPrefix + '-body');
        tbody.addEventListener('click', function(e) {
            var row = e.target.closest('.' + self.cssPrefix + '-row');
            if (row) {
                var index = parseInt(row.getAttribute('data-index'));
                var data = self.originalData[index];
                self.onRowClick(data, index, e);
            }
        });
    };

    SortableTable.prototype.handlePaginationAction = function(action) {
        switch (action) {
            case 'first':
                this.goToPage(1);
                break;
            case 'prev':
                if (this.currentPage > 1) {
                    this.goToPage(this.currentPage - 1);
                }
                break;
            case 'next':
                if (this.currentPage < this.totalPages) {
                    this.goToPage(this.currentPage + 1);
                }
                break;
            case 'last':
                this.goToPage(this.totalPages);
                break;
        }
    };

    SortableTable.prototype.goToPage = function(page) {
        if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
            this.currentPage = page;
            this.updateTable();
            
            if (this.onPageChange) {
                this.onPageChange(page, this.totalPages);
            }
        }
    };

    SortableTable.prototype.sort = function(columnKey, columnType, columnIndex) {
        var isCurrentColumn = this.currentSort.column === columnKey;
        var newDirection = isCurrentColumn && this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        
        this.currentSort = {
            column: columnKey,
            direction: newDirection
        };

        this.data.sort(function(a, b) {
            var aVal = a[columnIndex] != null ? a[columnIndex] : '';
            var bVal = b[columnIndex] != null ? b[columnIndex] : '';
            
            var comparison = 0;
            
            switch (columnType) {
                case 'number':
                    var aNum = parseFloat(aVal) || 0;
                    var bNum = parseFloat(bVal) || 0;
                    comparison = aNum - bNum;
                    break;
                case 'date':
                    var aDate = new Date(aVal || '1900-01-01');
                    var bDate = new Date(bVal || '1900-01-01');
                    comparison = aDate - bDate;
                    break;
                default:
                    comparison = String(aVal).toLowerCase().localeCompare(String(bVal).toLowerCase());
            }
            
            return newDirection === 'asc' ? comparison : -comparison;
        });

        // Reset to first page after sorting
        this.currentPage = 1;
        this.updateTable();

        if (this.onSort) {
            this.onSort(columnKey, newDirection);
        }
    };

    SortableTable.prototype.updateTable = function() {
        var tbody = this.container.querySelector('.' + this.cssPrefix + '-body');
        tbody.innerHTML = this.generateBodyHTML();
        this.updatePaginationState();
        this.updateSortIndicators();
        // Re-attach row click listeners for new rows
        if (this.onRowClick) {
            this.attachRowClickListeners();
        }
    };

    SortableTable.prototype.updatePaginationState = function() {
        if (!this.showPagination) return;

        var pagination = this.container.querySelector('.' + this.cssPrefix + '-pagination');
        if (!pagination) return;

        // Update page numbers
        var currentPageSpan = pagination.querySelector('.current-page-number');
        var totalPagesSpan = pagination.querySelector('.total-pages');
        
        if (currentPageSpan) currentPageSpan.textContent = this.currentPage;
        if (totalPagesSpan) totalPagesSpan.textContent = this.totalPages;

        // Update button states
        var firstBtn = pagination.querySelector('.first-page');
        var prevBtn = pagination.querySelector('.prev-page');
        var nextBtn = pagination.querySelector('.next-page');
        var lastBtn = pagination.querySelector('.last-page');

        if (firstBtn) firstBtn.disabled = this.currentPage <= 1;
        if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = this.currentPage >= this.totalPages;
        if (lastBtn) lastBtn.disabled = this.currentPage >= this.totalPages;
    };

    SortableTable.prototype.updateSortIndicators = function() {
        if (!this.allowSorting) return;

        // Clear all indicators
        var indicators = this.container.querySelectorAll('.sort-indicator');
        for (var i = 0; i < indicators.length; i++) {
            indicators[i].className = 'sort-indicator';
            indicators[i].textContent = '↕';
        }

        // Set current sort indicator
        if (this.currentSort.column) {
            var currentHeader = this.container.querySelector('th[data-column="' + this.currentSort.column + '"] .sort-indicator');
            if (currentHeader) {
                currentHeader.className = 'sort-indicator ' + this.currentSort.direction;
                currentHeader.textContent = this.currentSort.direction === 'asc' ? '↑' : '↓';
            }
        }
    };

    // Public API methods
    SortableTable.prototype.setData = function(newData) {
        this.data = newData.slice();
        this.originalData = newData.slice();
        this.totalPages = Math.ceil(this.data.length / this.rowsPerPage);
        this.currentPage = 1;
        this.updateTable();
    };

    SortableTable.prototype.addRow = function(rowData) {
        this.data.push(rowData);
        this.originalData.push(rowData);
        this.totalPages = Math.ceil(this.data.length / this.rowsPerPage);
        this.updateTable();
    };

    SortableTable.prototype.removeRow = function(index) {
        if (index >= 0 && index < this.data.length) {
            this.data.splice(index, 1);
            this.originalData.splice(index, 1);
            this.totalPages = Math.ceil(this.data.length / this.rowsPerPage);
            
            if (this.currentPage > this.totalPages) {
                this.currentPage = Math.max(1, this.totalPages);
            }
            
            this.updateTable();
        }
    };

    SortableTable.prototype.filter = function(predicate) {
        this.data = this.originalData.filter(predicate);
        this.totalPages = Math.ceil(this.data.length / this.rowsPerPage);
        this.currentPage = 1;
        this.updateTable();
    };

    SortableTable.prototype.clearFilter = function() {
        this.data = this.originalData.slice();
        this.totalPages = Math.ceil(this.data.length / this.rowsPerPage);
        this.currentPage = 1;
        this.updateTable();
    };

    SortableTable.prototype.getVisibleData = function() {
        var startIndex = (this.currentPage - 1) * this.rowsPerPage;
        var endIndex = Math.min(startIndex + this.rowsPerPage, this.data.length);
        return this.data.slice(startIndex, endIndex);
    };

    SortableTable.prototype.destroy = function() {
        // Clean up event listeners and DOM
        this.container.innerHTML = '';
        this.container.className = '';
    };

    // Export for use in other files - Safari compatible version
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = SortableTable;
    }

    // Always attach to window for browser compatibility
    if (typeof window !== 'undefined') {
        window.SortableTable = SortableTable;
    }

})();
