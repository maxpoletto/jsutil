# SortableTable

A reusable and configurable sortable table component with good pagination and theming support.

## Features

### Sorting
- Multi-type sorting (string, number, date, boolean), ascending/descending order
- Visual sort indicators with smooth transitions

### Navigation
- Navigation controls: First (`<<`), Previous (`<`), Next (`>`), Last (`>>`) buttons, disabled when not applicable
- Editable page number: click the current page number to jump to any page, press Enter to confirm, Escape to cancel
- Configurable page sizes

### Customization
- CSS custom properties for easy theming
- A few built-in themes (compact, spacious, minimal, bordered, solid)
- Custom formatter functions
- Responsive design with mobile-optimized layouts

### Efficiency
- Memory efficient: data is represented as an array of arrays
- Limited DOM manipulation (only updates visible rows)

## Quick Start

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="sortable-table.css">
</head>
<body>
    <div id="my-table"></div>
    
    <script src="sortable-table.js"></script>
    <script>
        const columns = [
            { key: 'id', label: 'ID', type: 'number' },
            { key: 'name', label: 'Name', type: 'string' },
            { key: 'salary', label: 'Salary', type: 'number', 
              formatter: (value) => `$${value.toLocaleString()}` },
            { key: 'startDate', label: 'Start Date', type: 'date' }
        ];

        const data = [
            [1, 'John Doe', 75000, new Date('2020-01-15')],
            [2, 'Jane Smith', 85000, new Date('2019-03-20')]
        ];

        const table = new SortableTable({
            container: '#my-table',
            data: data,
            columns: columns,
            rowsPerPage: 25
        });
    </script>
</body>
</html>
```

## Configuration Options

### Constructor

```javascript
const table = new SortableTable({
    // Required
    container: '#table-container',     // Element or selector
    data: [...],                       // Array of arrays (one array per row)
    columns: [...],                    // Column definitions (see below)

    // Optional
    rowsPerPage: 25,                   // Rows per page (default: 25)
    showPagination: true,              // Show pagination controls (default: true)
    allowSorting: true,                // Allow column sorting (default: true)
    cssPrefix: 'sortable-table',       // CSS class prefix (default: 'sortable-table')
    emptyMessage: 'No data available', // Message when no data (default: 'No data available')

    // Event callbacks
    onSort: (column, direction) => {...},        // Called when sorted
    onPageChange: (page, totalPages) => {...},   // Called when page changes
    onRowClick: (data, index, event) => {...}    // Called when row is clicked
});
```

### Column Definition

```javascript
const columns = [
    {
        key: 'fieldName',              // Data field name or function
        label: 'Display Name',         // Column header text
        type: 'string',                // 'string', 'number', 'date', 'boolean'
        width: '120px',                // Optional: column width
        sortable: true,                // Optional: allow sorting (default: true)
        className: 'custom-class',     // Optional: custom header CSS class
        cellClassName: 'cell-class',   // Optional: custom cell CSS class
        formatter: (value, row) => {   // Optional: custom formatter function
            return `$${value.toLocaleString()}`;
        }
    }
];
```

## API Methods

### Data Management
```javascript
// Update all data
table.setData(newDataArray);

// Add a single row
table.addRow(rowData);

// Remove a row by index
table.removeRow(index);

// Filter data (creates a view, doesn't modify original)
table.filter(row => row.salary > 50000);

// Clear all filters
table.clearFilter();
```

### Navigation
```javascript
// Go to specific page
table.goToPage(pageNumber);

// Get current page data
const currentData = table.getVisibleData();
```

### Cleanup
```javascript
// Destroy table and clean up event listeners
table.destroy();
```

## Theming

### CSS Custom Properties
```css
:root {
    --st-primary-color: #2196F3;     /* Accent color */
    --st-border-color: #ddd;         /* Border color */
    --st-header-bg: #f7f7f7;         /* Header background */
    --st-hover-bg: #f9f9f9;          /* Row hover background */
    --st-font-size: 13px;            /* Base font size */
    --st-padding: 8px;               /* Base padding */
    --st-border-radius: 4px;         /* Border radius for buttons and container,  */
}
```

### Built-in Theme Classes
```html
<!-- Compact theme -->
<div id="table" class="theme-compact"></div>

<!-- Spacious theme -->
<div id="table" class="theme-spacious"></div>

<!-- Minimal theme (no borders) -->
<div id="table" class="theme-minimal"></div>

<!-- Bordered cells -->
<div id="table" class="theme-bordered"></div>

<!-- Solid rows (no striping) -->
<div id="table" class="theme-solid"></div>
```


## Examples: a basic employee table
```javascript
const employees = [
    [1, 'Alice Johnson', 'Engineering', 95000, true],
    [2, 'Bob Smith', 'Marketing', 75000, true]
];

const table = new SortableTable({
    container: '#employee-table',
    data: employees,
    columns: [
        { key: 'id', label: 'ID', type: 'number', width: '60px' },
        { key: 'name', label: 'Name', type: 'string' },
        { key: 'department', label: 'Department', type: 'string' },
        { key: 'salary', label: 'Salary', type: 'number', 
          formatter: (value) => `$${value.toLocaleString()}` },
        { key: 'active', label: 'Status', type: 'boolean',
          formatter: (value) => value ? '✅ Active' : '❌ Inactive' }
    ],
    rowsPerPage: 20,
    onRowClick: (employee) => {
        alert(`Employee: ${employee[1]}\nSalary: $${employee[3].toLocaleString()}`);
    }
});
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Files

- [src/sortable-table.js](src/sortable-table.js) - Main table component
- [src/sortable-table.css](src/sortable-table.css) - Styles and themes
- [demo/demo.html](demo/demo.html) - Interactive demo page
- [test/sortable-table.test.html](test/sortable-table.test.html) - Tests
