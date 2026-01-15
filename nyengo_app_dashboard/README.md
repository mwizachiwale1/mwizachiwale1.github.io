# Nyengo Admin Dashboard

A web-based admin dashboard for the Nyengo e-commerce platform, designed for managing retailers, buyers, orders, and platform operations in Malawi.

## Features

### Authentication & Authorization
- Role-based access control (Super Admin, Support Staff)
- Secure login with email/password
- Session management and logout functionality
- Credential management via JSON files (for testing)

### Dashboard Overview
- Real-time metrics (buyers, retailers, transactions, delivery performance)
- Interactive growth charts and analytics
- User activity monitoring
- Performance indicators

### Retailer Management
- View and manage retail partners
- Performance tier system (Platinum, Gold, Silver, Bronze)
- Sales tracking and order analytics
- Geographic distribution (Lilongwe, Blantyre, Mzuzu)
- Subscription status monitoring

### Buyer Analytics
- User activity segmentation (Active, Dormant, Inactive)
- Geographic distribution by district
- Growth tracking and trend analysis
- New user registration metrics

### Order & Delivery Tracking
- Real-time order status monitoring
- Delivery performance tracking
- Courier assignment and contact information
- Payment method tracking (Mpamba, Airtel Money, Bank)

### Service Fee Management (Super Admin Only)
- Configure platform fees
- Registration and service fee management
- Fee change tracking and audit trails
- Impact analysis for fee adjustments

### Reporting System
- Executive summary reports
- Retailer performance reports
- Buyer behavior analytics
- Delivery performance metrics
- Export capabilities (PDF, Excel, CSV)

### Admin User Management (Super Admin Only)
- Create and manage admin accounts
- Role assignment and permissions
- Activity tracking and status monitoring

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Architecture**: Class-based JavaScript with async/await
- **Data**: JSON files for testing (credentials and dummy data)
- **Styling**: Custom CSS with responsive design
- **Charts**: HTML5 Canvas for data visualization

## Test Credentials

- **Super Admin**: admin@nyengo.com / admin123
- **Support Staff**: support@nyengo.com / support123

## Getting Started

See [SETUP.md](SETUP.md) for detailed setup instructions.

## Project Structure

```
nyengo_app_dashboard/
├── data/               # JSON data files
│   ├── credentials.json
│   └── dummy-data.json
├── js/                 # JavaScript files
│   ├── data-loader.js
│   └── main.js
├── css/                # Stylesheets
│   └── style.css
├── index.html          # Main dashboard
├── login.html          # Standalone login
└── README.md
```

## Development Notes

This is currently a frontend-only prototype using JSON files for data simulation. For production deployment:

1. Implement proper backend API
2. Use secure authentication (JWT, OAuth)
3. Replace JSON files with database
4. Add server-side validation
5. Implement proper error handling
6. Add logging and monitoring
7. Set up CI/CD pipeline

## License

This project is proprietary to Nyengo App.
