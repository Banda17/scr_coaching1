# Linux Installation Guide

## Prerequisites

### System Requirements
- Ubuntu 20.04/22.04 LTS or compatible Linux distribution
- Node.js 20.x
- PostgreSQL 14+
- Git
- Build essentials

### Install Required Software

1. **Update System:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Install Node.js:**
   ```bash
   # Add NodeSource repository
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

   # Install Node.js
   sudo apt install -y nodejs

   # Verify installation
   node --version
   npm --version
   ```

3. **Install PostgreSQL:**
   ```bash
   # Add PostgreSQL repository
   sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
   wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
   
   # Update package lists
   sudo apt update
   
   # Install PostgreSQL
   sudo apt install -y postgresql-14 postgresql-contrib
   
   # Start PostgreSQL service
   sudo systemctl enable postgresql
   sudo systemctl start postgresql
   
   # Verify installation
   psql --version
   ```

4. **Install Build Tools:**
   ```bash
   sudo apt install -y build-essential python3-pip
   ```

## Installation Steps

### 1. Clone and Setup Repository

1. Clone Repository:
   ```bash
   git clone <repository-url>
   cd railway-operations
   ```

2. Install Dependencies:
   ```bash
   npm install
   ```

### 2. Database Setup

1. Configure PostgreSQL:
   ```bash
   # Switch to postgres user
   sudo -i -u postgres
   
   # Create database
   createdb railway_ops
   
   # Create user (if needed)
   createuser --interactive
   
   # Set password for postgres user
   psql -c "ALTER USER postgres WITH PASSWORD 'your_password';"
   
   # Exit postgres user shell
   exit
   ```

2. Configure Environment:
   ```bash
   # Copy example environment file
   cp .env.example .env
   
   # Edit environment variables
   nano .env
   ```
   
   Add the following:
   ```env
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/railway_ops
   PGHOST=localhost
   PGPORT=5432
   PGUSER=postgres
   PGPASSWORD=your_password
   PGDATABASE=railway_ops
   ```

3. Run Database Migrations:
   ```bash
   npm run db:push
   ```

### 3. Development Environment

1. Start Development Server:
   ```bash
   npm run dev
   ```

2. Access Application:
   - Open browser: http://localhost:5000
   - Login with default credentials (if provided)

### 4. Production Setup

1. Configure Firewall:
   ```bash
   sudo ufw allow 5000/tcp
   sudo ufw status
   ```

2. Configure Process Manager:
   ```bash
   # Install PM2
   sudo npm install -g pm2
   
   # Start application
   pm2 start npm --name "railway-ops" -- start
   
   # Configure startup
   pm2 startup
   pm2 save
   ```

### 5. Troubleshooting

1. **PostgreSQL Issues:**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # View PostgreSQL logs
   sudo tail -f /var/log/postgresql/postgresql-14-main.log
   
   # Restart PostgreSQL
   sudo systemctl restart postgresql
   ```

2. **Permission Issues:**
4. **Database URL and Environment Issues:**

## Environment Variable Troubleshooting
## Cloud Database Configuration

### Using Cloud Databases (e.g., Neon, AWS RDS)

When using a cloud database service, your environment variables will differ from the local development settings. This is normal and expected. The verification script will detect cloud database configurations and provide appropriate guidance.

1. **Cloud Database URLs**
   ```bash
   # Example cloud DATABASE_URL formats:
   DATABASE_URL=postgresql://user:password@host.region.provider.tech/dbname?sslmode=require
   DATABASE_URL=postgresql://user:password@host.region.aws.provider.com/dbname
   ```

2. **Environment Variable Differences**
   - Cloud database credentials will override local .env settings
   - Different host patterns (e.g., *.provider.tech, *.amazonaws.com)
   - Additional URL parameters (e.g., sslmode=require)
   - Auto-generated passwords and usernames

3. **Verification Process**
   ```bash
   # Run the automated verification script
   ./scripts/verify_env.sh
   ```
   The script will:
   - Detect cloud database configurations
   - Validate connection strings
   - Test database connectivity
   - Provide appropriate warnings for environment differences

4. **Security Notes**
   - Always use SSL/TLS connections for cloud databases
   - Keep credentials secure and never commit them to version control
   - Use environment variables or secrets management for credentials
   - Regularly rotate database passwords
### Environment Variable Verification

1. **Quick Environment Variable Check**
   ```bash
   # Display all PostgreSQL related environment variables
   printenv | grep -E "DATABASE_URL|PG(HOST|PORT|USER|PASSWORD|DATABASE)"
   ```

2. **Verify .env File**
   ```bash
   # Check if .env file exists and has correct permissions
   ls -la .env
   
   # Display .env file contents (excluding comments)
   cat .env | grep -v '^#' | grep .
   
   # Fix permissions if needed
   chmod 600 .env
   ```

3. **Manual Export (Temporary Solution)**
   ```bash
   # Export variables directly
   export DATABASE_URL="postgresql://$PGUSER:$PGPASSWORD@$PGHOST:$PGPORT/$PGDATABASE"
   ```

4. **Reload Environment**
   ```bash
   # Force reload .env file
   set -a; source .env; set +a
   ```

5. **Create Start Script**
   ```bash
   # Create a script that loads environment before starting
   echo '#!/bin/bash
   set -a
   source .env
   set +a
   npm run dev' > start-app.sh
   
   chmod +x start-app.sh
   ./start-app.sh
   ```
3. **Automated Environment Verification**
   ```bash
   # Download and run the verification script
   curl -O https://raw.githubusercontent.com/your-repo/railway-operations/main/scripts/verify_env.sh
   chmod +x verify_env.sh
   ./verify_env.sh
   ```

   This script will:
   - Verify .env file existence and permissions
   - Check all required environment variables
   - Validate DATABASE_URL format
   - Test PostgreSQL connection
   - Compare environment variables with .env contents

### Environment Variable Verification
1. **Check Current Environment Variables**
   ```bash
   # Display current PostgreSQL environment variables
   echo "Current environment variables:"
   printenv | grep -E "^(DATABASE_URL|PG(HOST|PORT|USER|PASSWORD|DATABASE))="
   
   # Compare with .env file contents
   echo -e "\nEnvironment file contents:"
   cat .env | grep -E "^(DATABASE_URL|PG(HOST|PORT|USER|PASSWORD|DATABASE))="
   ```

2. **Verify Variable Format**
   ```bash
   # Check DATABASE_URL format
   echo "DATABASE_URL format check:"
   if [[ $DATABASE_URL =~ ^postgresql://[^:]+:[^@]+@[^:]+:[0-9]+/[^/]+$ ]]; then
     echo "✓ DATABASE_URL format is valid"
   else
     echo "✗ DATABASE_URL format is invalid"
     echo "Expected format: postgresql://user:password@host:port/database"
   fi
   ```


### Environment Variable Verification
1. **Check Current Environment Variables**
   ```bash
   # Display current PostgreSQL environment variables
   echo "Current environment variables:"
   printenv | grep -E "^(DATABASE_URL|PG(HOST|PORT|USER|PASSWORD|DATABASE))="
   
   # Compare with .env file contents
   echo -e "\nEnvironment file contents:"
   cat .env | grep -E "^(DATABASE_URL|PG(HOST|PORT|USER|PASSWORD|DATABASE))="
   ```

3. **Automated Environment Verification**
   ```bash
   # Download and run the verification script
   curl -O https://raw.githubusercontent.com/your-repo/railway-operations/main/scripts/verify_env.sh
   chmod +x verify_env.sh
   ./verify_env.sh
   ```

   This script will:
   - Verify .env file existence and permissions
   - Check all required environment variables
   - Validate DATABASE_URL format
   - Test PostgreSQL connection
   - Compare environment variables with .env contents

2. **Verify Variable Format**
   ```bash
   # Check DATABASE_URL format
   echo "DATABASE_URL format check:"
   if [[ $DATABASE_URL =~ ^postgresql://[^:]+:[^@]+@[^:]+:[0-9]+/[^/]+$ ]]; then
     echo "✓ DATABASE_URL format is valid"
   else
     echo "✗ DATABASE_URL format is invalid"
     echo "Expected format: postgresql://user:password@host:port/database"
   fi
   ```

### DATABASE_URL Troubleshooting

### Common DATABASE_URL Issues and Solutions

#### 1. Missing or Invalid DATABASE_URL
If you encounter the error "Error: DATABASE_URL must be set" or similar database connection issues, follow these steps:

1. **Check Configuration**
   ```bash
   # Verify environment variables
   printenv | grep DATABASE_URL
   
   # Check .env file
   cat .env | grep DATABASE_URL
   ```

2. **Fix Common Issues**
   - Ensure .env file exists and has correct permissions
   - Verify DATABASE_URL format matches: postgresql://user:password@host:port/database
   - Check that all credentials are correctly specified

3. **Apply Solutions**
   ```bash
   # Fix file permissions
   chmod 600 .env
   
   # Reload environment
   set -a; source .env; set +a
   ```

#### 2. Connection Issues
If DATABASE_URL is set but you can't connect to the database:

1. **Verify Database Service**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Test connection
   pg_isready -h $PGHOST -p $PGPORT
   ```

2. **Check Database Access**
   ```bash
   # Verify user permissions
   sudo -u postgres psql -c "\du"
   
   # Test direct connection
   psql $DATABASE_URL -c "\conninfo"
   ```

    ```bash
    # Quick Fix for DATABASE_URL Error:
    # If you encounter "Error: DATABASE_URL must be set" despite having a .env file:
    
    # 1. First, verify if environment variables are loaded
    printenv | grep -E "DATABASE_URL|PG(HOST|PORT|USER|PASSWORD|DATABASE)"
    
    # 2. If variables are not loaded, try these solutions:
    
    # Solution A: Export variables directly (temporary fix)
    export DATABASE_URL="postgresql://$PGUSER:$PGPASSWORD@$PGHOST:$PGPORT/$PGDATABASE"
    # OR explicitly:
    export DATABASE_URL="postgresql://your_username:your_password@localhost:5432/railway_ops"
    
    # Solution B: Force reload .env file
    set -a; source .env; set +a
    
    # Solution C: Verify .env file permissions and content
    ls -l .env
    chmod 600 .env
    cat .env | grep -v '^#' | grep .
    
    # 3. Verify all PostgreSQL environment variables
    echo "Database URL: $DATABASE_URL"
    echo "Host: $PGHOST"
    echo "Port: $PGPORT"
    echo "User: $PGUSER"
    echo "Database: $PGDATABASE"
    
    # 4. Test database connection
    # Using DATABASE_URL
    psql $DATABASE_URL -c "\conninfo"
    
    # Using individual parameters
    psql "postgresql://$PGUSER:$PGPASSWORD@$PGHOST:$PGPORT/$PGDATABASE" -c "\conninfo"
    
    # 5. Verify PostgreSQL service status
    pg_isready -h $PGHOST -p $PGPORT
    sudo systemctl status postgresql
    
    # 6. Check PostgreSQL configuration
    sudo -u postgres psql -c "SHOW listen_addresses;"
    sudo -u postgres psql -c "SHOW port;"
    sudo -u postgres psql -c "\du"
    ```
1. **Quick Environment Variable Check**
    Common Issues and Solutions:
    
    1. DATABASE_URL Not Found:
       ```bash
       # Create/Edit .env file if missing
       nano .env
       
       # Add these lines to .env:
       DATABASE_URL=postgresql://postgres:your_password@localhost:5432/railway_ops
       PGHOST=localhost
       PGPORT=5432
       PGUSER=postgres
       PGPASSWORD=your_password
       PGDATABASE=railway_ops
       
       # Save and reload environment
       set -a; source .env; set +a
       ```
    
    2. Connection Issues:
       ```bash
       # Verify PostgreSQL is running
       sudo systemctl status postgresql
       
       # Check PostgreSQL is listening
       sudo netstat -plunt | grep postgres
       
       # Verify connection settings
       sudo cat /etc/postgresql/14/main/pg_hba.conf
       
       # Ensure database exists
       sudo -u postgres psql -l
       ```
    
    3. Permission Issues:
       ```bash
       # Check user exists and permissions
       sudo -u postgres psql -c "\du"
       
       # Grant necessary permissions
       sudo -u postgres psql -c "ALTER USER your_user WITH LOGIN CREATEDB SUPERUSER;"
       
       # Verify database ownership
       sudo -u postgres psql -c "\l+" | grep railway_ops
       
       # Fix file permissions if needed
       sudo chown -R $USER:$USER .
       chmod 600 .env
       ```
       
    4. Environment Loading Issues:
       ```bash
       # Add to ~/.bashrc or ~/.profile
       echo 'set -a; source /path/to/your/project/.env; set +a' >> ~/.bashrc
       source ~/.bashrc
       
       # Or create a script to load environment
       echo '#!/bin/bash
       set -a
       source .env
       set +a
       npm run dev' > start-server.sh
       chmod +x start-server.sh
       ./start-server.sh
       ```
   ```bash
   # Display all PostgreSQL related environment variables
   printenv | grep -E "DATABASE_URL|PG(HOST|PORT|USER|PASSWORD|DATABASE)"
   ```

2. **Verify .env File**
   ```bash
   # Check if .env file exists and has correct permissions
   ls -la .env
   
   # Display .env file contents (excluding comments)
   cat .env | grep -v '^#' | grep .
   
   # Fix permissions if needed
   chmod 600 .env
   ```

3. **Manual Export (Temporary Solution)**
   ```bash
   # Export variables directly
   export DATABASE_URL="postgresql://$PGUSER:$PGPASSWORD@$PGHOST:$PGPORT/$PGDATABASE"
   ```

4. **Reload Environment**
   ```bash
   # Force reload .env file
   set -a; source .env; set +a
   ```

5. **Create Start Script**
   ```bash
   # Create a script that loads environment before starting
   echo '#!/bin/bash
   set -a
   source .env
   set +a
   npm run dev' > start-app.sh
   
   chmod +x start-app.sh
   ./start-app.sh
   ```

    ### Quick Fix Guide for DATABASE_URL Issues

If you encounter "Error: DATABASE_URL must be set" despite having a .env file, follow these steps:

1. **Verify Environment Variables**
   ```bash
   # Check current environment variables
   printenv | grep -E "DATABASE_URL|PG(HOST|PORT|USER|PASSWORD|DATABASE)"
   ```

2. **Quick Solutions**
   ```bash
   # Solution A: Export variables directly (temporary)
   export DATABASE_URL="postgresql://$PGUSER:$PGPASSWORD@$PGHOST:$PGPORT/$PGDATABASE"
   
   # Solution B: Force reload .env file
   set -a; source .env; set +a
   
   # Solution C: Check file permissions
   chmod 600 .env
   ```

3. **Verify Configuration**
   ```bash
   # Test database connection
   psql $DATABASE_URL -c "\conninfo"
   
   # Check PostgreSQL service
   pg_isready -h $PGHOST -p $PGPORT
   sudo systemctl status postgresql
   
   # Verify PostgreSQL settings
   sudo -u postgres psql -c "SHOW listen_addresses;"
   sudo -u postgres psql -c "SHOW port;"
   sudo -u postgres psql -c "\du"
   ```

    Common Issues and Solutions:
    
    1. DATABASE_URL Not Found:
       ```bash
       # Create/Edit .env file if missing
       nano .env
       
       # Add these lines to .env:
       DATABASE_URL=postgresql://postgres:your_password@localhost:5432/railway_ops
       PGHOST=localhost
       PGPORT=5432
       PGUSER=postgres
       PGPASSWORD=your_password
       PGDATABASE=railway_ops
       
       # Save and reload environment
       set -a; source .env; set +a
       ```
    
    2. Connection Issues:
       ```bash
       # Verify PostgreSQL is running
       sudo systemctl status postgresql
       
       # Check PostgreSQL is listening
       sudo netstat -plunt | grep postgres
       
       # Verify connection settings
       sudo cat /etc/postgresql/14/main/pg_hba.conf
       
       # Ensure database exists
       sudo -u postgres psql -l
       ```
    
    3. Permission Issues:
       ```bash
       # Check user exists and permissions
       sudo -u postgres psql -c "\du"
       
       # Grant necessary permissions
       sudo -u postgres psql -c "ALTER USER your_user WITH LOGIN CREATEDB SUPERUSER;"
       
       # Verify database ownership
       sudo -u postgres psql -c "\l+" | grep railway_ops
       
       # Fix file permissions if needed
       sudo chown -R $USER:$USER .
       chmod 600 .env
       ```
       
    4. Environment Loading Issues:
       ```bash
       # Add to ~/.bashrc or ~/.profile
       echo 'set -a; source /path/to/your/project/.env; set +a' >> ~/.bashrc
       source ~/.bashrc
       
       # Or create a script to load environment
       echo '#!/bin/bash
       set -a
       source .env
       set +a
       npm run dev' > start-server.sh
       chmod +x start-server.sh
       ./start-server.sh
       ```

   ```bash
   # Fix project directory permissions
   sudo chown -R $USER:$USER .
   
   # Fix npm permissions
   mkdir -p ~/.npm-global
   npm config set prefix '~/.npm-global'
   echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.profile
   source ~/.profile
   ```

3. **Port Conflicts:**
   ```bash
   # Check ports in use
   sudo lsof -i :5000
   
   # Kill process using port
   sudo kill -9 <PID>
   ```

### 6. Linux-Specific Notes

1. **System Limits:**
   ```bash
   # Increase file watchers limit
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

2. **Database Maintenance:**
   ```bash
   # Create backup script
   sudo nano /etc/cron.daily/backup-railway-ops
   ```
   
   Add:
   ```bash
   #!/bin/bash
   pg_dump railway_ops > /backup/railway_ops_$(date +%Y%m%d).sql
   ```
   
   ```bash
   # Make script executable
   sudo chmod +x /etc/cron.daily/backup-railway-ops
   ```

3. **Resource Monitoring:**
   ```bash
   # Install monitoring tools
   sudo apt install -y htop iotop
   
   # Monitor system resources
   htop
   ```

4. **Security Considerations:**
   - Configure UFW firewall
   - Set up fail2ban
   - Regular system updates
   - SSL/TLS configuration
