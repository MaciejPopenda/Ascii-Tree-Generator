#!/bin/bash

# Script 1: React/Next.js Project Structure
generate_nextjs_project() {
    local project_name="nextjs-test-project"
    
    echo "Generating Next.js project structure..."
    
    # Create main directories
    mkdir -p "$project_name"/{src,public,components,pages,styles,lib,utils,hooks}
    mkdir -p "$project_name"/.next/{cache,server,static}
    mkdir -p "$project_name"/node_modules/{react,next,"@types"}
    mkdir -p "$project_name"/components/{ui,forms,layout}
    mkdir -p "$project_name"/pages/{api,auth}
    mkdir -p "$project_name"/public/{images,icons}
    
    # Create files
    touch "$project_name"/{package.json,package-lock.json,next.config.js,tsconfig.json}
    touch "$project_name"/{.env.local,.env.example,.gitignore}
    touch "$project_name"/README.md
    touch "$project_name"/src/{layout.tsx,page.tsx,loading.tsx,error.tsx}
    touch "$project_name"/components/{Header.tsx,Footer.tsx,Sidebar.tsx}
    touch "$project_name"/components/ui/{Button.tsx,Modal.tsx,Input.tsx}
    touch "$project_name"/components/forms/{LoginForm.tsx,ContactForm.tsx}
    touch "$project_name"/pages/{index.tsx,about.tsx,contact.tsx}
    touch "$project_name"/pages/api/{users.ts,auth.ts}
    touch "$project_name"/styles/{globals.css,Home.module.css,components.css}
    touch "$project_name"/lib/{auth.ts,database.ts,utils.ts}
    touch "$project_name"/utils/{format.ts,validation.ts}
    touch "$project_name"/hooks/{useAuth.ts,useLocalStorage.ts}
    
    # Build artifacts and cache
    touch "$project_name"/.next/cache/{webpack,babel}
    mkdir -p "$project_name"/.next/server/{pages,chunks}
    touch "$project_name"/.next/server/pages/{index.js,about.js}
    touch "$project_name"/.next/server/chunks/{main-123.js,vendor-456.js}
    touch "$project_name"/.next/static/{chunks,css}
    touch "$project_name"/.next/{BUILD_ID,build-manifest.json,export-marker.json}
    
    # Node modules structure
    mkdir -p "$project_name"/node_modules/.cache/{babel-loader,terser-webpack-plugin}
    touch "$project_name"/node_modules/react/{package.json,index.js}
    touch "$project_name"/node_modules/next/{package.json,index.js,dist}
    
    echo "✅ Next.js project structure created in '$project_name'"
}

# Script 2: Python Project Structure
generate_python_project() {
    local project_name="python-test-project"
    
    echo "Generating Python project structure..."
    
    # Create directories
    mkdir -p "$project_name"/{src,tests,docs,scripts}
    mkdir -p "$project_name"/src/{models,views,controllers,utils}
    mkdir -p "$project_name"/{.pytest_cache,__pycache__,.venv}
    mkdir -p "$project_name"/dist
    mkdir -p "$project_name"/.coverage_data
    
    # Create files
    touch "$project_name"/{README.md,requirements.txt,setup.py,pyproject.toml}
    touch "$project_name"/{.gitignore,.env,.env.example}
    touch "$project_name"/{Dockerfile,docker-compose.yml}
    touch "$project_name"/src/{__init__.py,main.py,config.py}
    touch "$project_name"/src/models/{__init__.py,user.py,product.py}
    touch "$project_name"/src/views/{__init__.py,api.py,web.py}
    touch "$project_name"/src/controllers/{__init__.py,auth.py,admin.py}
    touch "$project_name"/src/utils/{__init__.py,helpers.py,validators.py}
    touch "$project_name"/tests/{__init__.py,test_models.py,test_views.py,conftest.py}
    touch "$project_name"/docs/{index.md,api.md,deployment.md}
    touch "$project_name"/scripts/{deploy.sh,migrate.py,seed_data.py}
    
    # Cache and build artifacts
    mkdir -p "$project_name"/__pycache__
    touch "$project_name"/__pycache__/{main.cpython-39.pyc,config.cpython-39.pyc}
    mkdir -p "$project_name"/src/__pycache__
    touch "$project_name"/src/__pycache__/{__init__.cpython-39.pyc,main.cpython-39.pyc}
    touch "$project_name"/.coverage
    mkdir -p "$project_name"/.pytest_cache/{v,CACHEDIR.TAG}
    touch "$project_name"/dist/{package-1.0.0.tar.gz,package-1.0.0-py3-none-any.whl}
    
    echo "✅ Python project structure created in '$project_name'"
}

# Script 3: Node.js Project with Build Artifacts
generate_nodejs_project() {
    local project_name="nodejs-test-project"
    
    echo "Generating Node.js project with build artifacts..."
    
    # Create directories
    mkdir -p "$project_name"/{src,dist,build,public,config}
    mkdir -p "$project_name"/{node_modules,coverage,.nyc_output}
    mkdir -p "$project_name"/src/{routes,middleware,services,models}
    mkdir -p "$project_name"/dist/{js,css,assets}
    mkdir -p "$project_name"/build/{chunks,assets}
    mkdir -p "$project_name"/node_modules/.cache/{babel,webpack,terser}
    
    # Create files
    touch "$project_name"/{package.json,package-lock.json,webpack.config.js}
    touch "$project_name"/{babel.config.js,jest.config.js,.eslintrc.js}
    touch "$project_name"/{.gitignore,.env,.env.production}
    touch "$project_name"/src/{index.js,app.js,server.js}
    touch "$project_name"/src/routes/{users.js,auth.js,products.js}
    touch "$project_name"/src/middleware/{auth.js,cors.js,validation.js}
    touch "$project_name"/src/services/{database.js,email.js,payment.js}
    touch "$project_name"/src/models/{User.js,Product.js,Order.js}
    touch "$project_name"/config/{database.js,redis.js,smtp.js}
    
    # Build outputs
    touch "$project_name"/dist/js/{main.bundle.js,vendor.bundle.js,runtime.js}
    touch "$project_name"/dist/css/{main.css,components.css}
    touch "$project_name"/dist/{index.html,manifest.json}
    touch "$project_name"/build/chunks/{chunk1-abc123.js,chunk2-def456.js}
    touch "$project_name"/build/assets/{logo.png,favicon.ico}
    touch "$project_name"/build/{asset-manifest.json,service-worker.js}
    
    # Cache and test artifacts
    mkdir -p "$project_name"/node_modules/.cache/babel/{babel-config-hash}
    touch "$project_name"/node_modules/.cache/babel/babel-config-hash/{index.js,metadata.json}
    touch "$project_name"/coverage/{lcov.info,coverage-final.json,index.html}
    mkdir -p "$project_name"/.nyc_output
    touch "$project_name"/.nyc_output/{coverage.json,out.json}
    
    echo "✅ Node.js project structure created in '$project_name'"
}

# Script 4: Complex Full-Stack Project 
generate_fullstack_project() {
    local project_name="fullstack-test-project"
    
    echo "Generating complex full-stack project..."
    
    # Create directories
    mkdir -p "$project_name"/{frontend,backend,shared,docs,scripts,docker}
    mkdir -p "$project_name"/frontend/{src,public,build,node_modules}
    mkdir -p "$project_name"/backend/{src,dist,uploads,logs,node_modules}
    mkdir -p "$project_name"/shared/{types,utils,constants}
    mkdir -p "$project_name"/{.git,.github/workflows}
    
    # Frontend structure
    mkdir -p "$project_name"/frontend/src/{components,pages,hooks,services,store}
    mkdir -p "$project_name"/frontend/{.next,coverage}
    touch "$project_name"/frontend/{package.json,next.config.js,tailwind.config.js}
    touch "$project_name"/frontend/src/components/{Header.tsx,Layout.tsx}
    touch "$project_name"/frontend/src/pages/{index.tsx,dashboard.tsx}
    touch "$project_name"/frontend/build/{static,asset-manifest.json}
    
    # Backend structure  
    mkdir -p "$project_name"/backend/src/{controllers,services,models,middleware}
    mkdir -p "$project_name"/backend/{migrations,seeders,tests}
    touch "$project_name"/backend/{package.json,server.js,knexfile.js}
    touch "$project_name"/backend/src/controllers/{userController.js,authController.js}
    touch "$project_name"/backend/src/services/{emailService.js,paymentService.js}
    touch "$project_name"/backend/uploads/{images,documents}
    touch "$project_name"/backend/logs/{app.log,error.log,access.log}
    
    # Shared files
    touch "$project_name"/shared/types/{User.ts,Product.ts,API.ts}
    touch "$project_name"/shared/utils/{format.ts,validation.ts}
    touch "$project_name"/shared/constants/{status.ts,config.ts}
    
    # Root level files
    touch "$project_name"/{README.md,docker-compose.yml,Makefile}
    touch "$project_name"/{.gitignore,.env.example,lerna.json}
    touch "$project_name"/docker/{Dockerfile.frontend,Dockerfile.backend,nginx.conf}
    touch "$project_name"/.github/workflows/{ci.yml,deploy.yml}
    touch "$project_name"/scripts/{setup.sh,deploy.sh,backup.sh}
    
    echo "✅ Full-stack project structure created in '$project_name'"
}

# Script 5: Edge Cases Project (special characters, deep nesting, etc.)
generate_edge_cases_project() {
    local project_name="edge-cases-project"
    
    echo "Generating project with edge cases..."
    
    # Create directories with special characters and deep nesting
    mkdir -p "$project_name"/{".hidden-dir","folder with spaces","folder-with-dashes"}
    mkdir -p "$project_name"/very/deep/nested/folder/structure/that/goes/on/and/on
    mkdir -p "$project_name"/node_modules/{".bin",".cache","@scoped","weird-package-name"}
    
    # Files with special characters
    touch "$project_name"/{".env",".gitignore",".DS_Store",".vscode"}
    touch "$project_name"/"file with spaces.js"
    touch "$project_name"/"file-with-dashes.js"
    touch "$project_name"/"file_with_underscores.js"
    touch "$project_name"/"file.with.dots.js"
    touch "$project_name"/"UPPERCASE.JS"
    touch "$project_name"/"file123.js"
    
    # Hidden files in subdirectories
    touch "$project_name"/.hidden-dir/{".hidden-file",".another-hidden"}
    touch "$project_name"/"folder with spaces"/"another file with spaces.txt"
    
    # Very long filename
    touch "$project_name"/"this-is-a-very-long-filename-that-might-cause-issues-with-some-tree-generators-and-should-be-tested.js"
    
    # Deep nesting with files
    touch "$project_name"/very/deep/nested/folder/structure/that/goes/on/and/on/{file1.js,file2.js}
    
    # Scoped packages
    mkdir -p "$project_name"/node_modules/@scoped/{package1,package2}
    touch "$project_name"/node_modules/@scoped/package1/{package.json,index.js}
    
    # Binary and various extensions
    touch "$project_name"/{image.png,doc.pdf,archive.zip,data.json,config.xml,style.css}
    
    # Numbered files and directories
    mkdir -p "$project_name"/{dir1,dir2,dir10,dir20}
    touch "$project_name"/{file1.js,file2.js,file10.js,file20.js}
    
    echo "✅ Edge cases project structure created in '$project_name'"
}

# Main execution
echo "🚀 Generating test project structures..."
echo "----------------------------------------"

generate_nextjs_project
echo ""
generate_python_project  
echo ""
generate_nodejs_project
echo ""
generate_fullstack_project
echo ""
generate_edge_cases_project

echo ""
echo "🎉 All project structures generated successfully!"
echo "You now have 5 different project structures to test your ASCII tree generator:"
echo "  1. nextjs-test-project - React/Next.js with build artifacts"
echo "  2. python-test-project - Python with cache and virtual env"
echo "  3. nodejs-test-project - Node.js with webpack builds"
echo "  4. fullstack-test-project - Complex monorepo structure"
echo "  5. edge-cases-project - Special characters and edge cases"