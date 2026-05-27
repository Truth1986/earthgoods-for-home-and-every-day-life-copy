<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Earthgoods - Home & Everyday Living</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        header { background: #2d5016; color: white; padding: 1rem; text-align: center; }
        nav { background: #4a7c2c; padding: 1rem; }
        nav a { color: white; margin: 0 1rem; text-decoration: none; }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        .products { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; }
        .product-card { border: 1px solid #ddd; padding: 1rem; border-radius: 8px; }
        .product-card h3 { color: #2d5016; margin: 0.5rem 0; }
        footer { background: #2d5016; color: white; text-align: center; padding: 1rem; }
    </style>
</head>
<body>
    <header>
        <h1>Earthgoods</h1>
        <p>Sustainable Home & Everyday Living</p>
    </header>
    
    <nav>
        <a href="#home">Home</a>
        <a href="#products">Products</a>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
    </nav>
    
    <div class="container">
        <h2>Our Products</h2>
        <div class="products">
            <div class="product-card">
                <h3>Eco-Friendly Kitchen</h3>
                <p>Sustainable kitchen essentials and dinnerware</p>
            </div>
            <div class="product-card">
                <h3>Natural Bath & Body</h3>
                <p>Organic personal care products</p>
            </div>
            <div class="product-card">
                <h3>Home Decor</h3>
                <p>Sustainable home furnishings and accessories</p>
            </div>
        </div>
    </div>
    
    <footer>
        <p>&copy; 2024 Earthgoods. All rights reserved.</p>
    </footer>
</body>
</html>