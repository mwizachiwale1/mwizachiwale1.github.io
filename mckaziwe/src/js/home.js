class Cart{
    constructor(){
        this.state = 0;
        this.activated = 0;
        this.cartElement = document.getElementById("cart");
        this.cartContainer = document.getElementById("cart_container");
    }
    showCart(){
      if(this.activated == 1){
        this.cartContainer.classList.remove("animate__slideOutDown");
      }
      this.cartContainer.classList.add("animate__slideInUp");
      this.cartElement.classList.remove("hidden");
    }
    hideCart(){
      this.cartContainer.classList.remove("animate__slideInUp");
      this.cartContainer.classList.add("animate__slideOutDown");
      setTimeout(() => {
      this.cartElement.classList.add("hidden");
        
      }, 200);
    }
    hide(){
      document.addEventListener("click", function(evt) {
        let flyoutEl = this.cartContainer,
          targetEl = evt.target; // clicked element
          if(targetEl == flyoutEl) {
            // This is a click inside, does nothing, just return.
            return;
          }else{
            cart.cartControl();

          }
        // This is a click outside.
      });
    }
    cartControl(){
      if(this.state == 0){
        this.showCart();
        this.activated = 1;
        this.state = 1;
        // this.hide();
      } else{
        this.hideCart();
        this.state = 0;
      }
    }
    
}
var cart = new Cart();
document.getElementById("cart-button-open").addEventListener("click", function(e){
  e.preventDefault();
  cart.cartControl();
});
document.getElementById("cart-button-close").addEventListener("click", function(e){
  e.preventDefault();
  cart.cartControl();
});



