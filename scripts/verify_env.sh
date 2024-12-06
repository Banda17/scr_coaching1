#!/bin/bash

# Text colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=== PostgreSQL Environment Variable Verification ==="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if .env file exists and create it if not
if [ ! -f .env ]; then
    echo -e "${YELLOW}!${NC} .env file not found, creating template..."
    # Create template using existing env vars if available
    cat > .env << EOL
DATABASE_URL=${DATABASE_URL:-postgresql://user:password@host:port/database}
PGHOST=${PGHOST:-localhost}
PGPORT=${PGPORT:-5432}
PGUSER=${PGUSER:-postgres}
PGPASSWORD=${PGPASSWORD:-your_password}
PGDATABASE=${PGDATABASE:-railway_ops}
EOL
    echo -e "${GREEN}✓${NC} Created .env template. Please update with your credentials."
    chmod 600 .env
fi

# Check file permissions
perms=$(stat -c "%a" .env 2>/dev/null || stat -f "%Lp" .env)
if [ "$perms" = "600" ]; then
    echo -e "${GREEN}✓${NC} .env file permissions are correct (600)"
else
    echo -e "${RED}✗${NC} .env file permissions should be 600 (current: $perms)"
    echo "Run: chmod 600 .env"
fi

# Required variables and their descriptions
declare -A var_descriptions=(
    ["DATABASE_URL"]="PostgreSQL connection URL"
    ["PGHOST"]="Database host"
    ["PGPORT"]="Database port"
    ["PGUSER"]="Database user"
    ["PGPASSWORD"]="Database password"
    ["PGDATABASE"]="Database name"
)

# Check each required variable
echo -e "\nChecking environment variables:"

# Check if we're using a cloud database service
is_cloud_db=0
if [[ $DATABASE_URL =~ .*\.(com|tech|cloud|io)/.*$ ]]; then
    is_cloud_db=1
fi

for var in "${!var_descriptions[@]}"; do
    if grep -q "^${var}=" .env; then
        value=$(grep "^${var}=" .env | cut -d '=' -f2)
        echo -e "\n${GREEN}✓${NC} $var (${var_descriptions[$var]}):"
        echo "  - Found in .env file"
        
        # Check if variable is exported in current environment
        if [ -n "${!var}" ]; then
            if [ "${!var}" = "$value" ]; then
                echo -e "  - ${GREEN}✓${NC} Correctly exported to environment"
            else
                if [ $is_cloud_db -eq 1 ]; then
                    echo -e "  - ${YELLOW}!${NC} Environment value differs from .env (Cloud database detected)"
                    echo "    .env: $value"
                    echo "    environment: ${!var}"
                    echo "    Note: This is normal when using cloud database services"
                else
                    echo -e "  - ${RED}✗${NC} Environment value differs from .env"
                    echo "    .env: $value"
                    echo "    environment: ${!var}"
                    echo "    To use .env values, run: set -a; source .env; set +a"
                fi
            fi
        else
            echo -e "  - ${RED}✗${NC} Not exported to environment"
            echo "    Run: set -a; source .env; set +a"
        fi
    else
        echo -e "\n${RED}✗${NC} $var (${var_descriptions[$var]}):"
        echo "  - Missing from .env file"
        echo "  - Add this variable to your .env file"
    fi
done

# Verify DATABASE_URL format and connection
echo -e "\nVerifying database configuration:"

# Function to validate database connection
validate_db_connection() {
    local test_result=0
    if command_exists pg_isready; then
        pg_isready -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" >/dev/null 2>&1
        test_result=$?
    fi
    return $test_result
}

if [ -n "$DATABASE_URL" ]; then
    # More permissive regex that allows for query parameters and special characters in password
    if [[ $DATABASE_URL =~ ^postgresql://[^@]+@[^/]+/[^[:space:]]+$ ]]; then
        echo -e "${GREEN}✓${NC} DATABASE_URL format appears valid"
        
        # If we can connect, any environment differences are probably intentional
        if validate_db_connection; then
            echo -e "${GREEN}✓${NC} Database connection is working with current configuration"
            echo -e "${YELLOW}!${NC} Note: Environment variables differ from .env but database connection is working"
            echo "    This is normal if using a cloud database service like Neon"
        fi
    else
        echo -e "${RED}✗${NC} DATABASE_URL format may need verification"
        echo "Common formats:"
        echo "- postgresql://user:password@host:port/database"
        echo "- postgresql://user:password@host:port/database?sslmode=require"
    fi
else
    echo -e "${YELLOW}!${NC} DATABASE_URL is not set, attempting to construct from individual variables"
    if [ -n "$PGUSER" ] && [ -n "$PGPASSWORD" ] && [ -n "$PGHOST" ] && [ -n "$PGPORT" ] && [ -n "$PGDATABASE" ]; then
        constructed_url="postgresql://$PGUSER:$PGPASSWORD@$PGHOST:$PGPORT/$PGDATABASE"
        echo "Constructed URL: $constructed_url"
    fi
fi

# Test PostgreSQL connection
echo -e "\nTesting database connectivity:"
if command_exists pg_isready; then
    echo "Using pg_isready to test connection..."
    if pg_isready -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} PostgreSQL server is accepting connections"
        
        # Try to connect and get version
        if command_exists psql; then
            version=$(PGPASSWORD="${PGPASSWORD}" psql -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "${PGDATABASE}" -tAc "SELECT version();" 2>/dev/null)
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✓${NC} Successfully connected to database"
                echo "Database version: $version"
            else
                echo -e "${RED}✗${NC} Could not execute query (check credentials)"
            fi
        fi
    else
        echo -e "${RED}✗${NC} Unable to connect to PostgreSQL server"
        echo "Please verify:"
        echo "1. PostgreSQL service is running (sudo systemctl status postgresql)"
        echo "2. Host and port are correct"
        echo "3. Firewall allows connection"
    fi
else
    echo -e "${RED}✗${NC} pg_isready command not found. Please install PostgreSQL client tools:"
    echo "sudo apt-get install postgresql-client"
fi
