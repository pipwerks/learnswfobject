var gen = {
	
	dom: {
		publishing_method: null,
		google_api: null,
		use_express_install: null,
		basics: { h2: null, toggler: null, summary: null },
		advanced: { h2: null, toggler: null, teaser: null },
		generated: { form: null, h2: null, toggler: null, wrapper: null, code: null }
	},
	
	init: function (){

		$("generator").addEvent("submit", gen.processForm);
		
		//Make IE6 play nice
		if(Browser.Engine.trident){
			$("submit").addEvents({
				mouseover: function (){ this.addClass("hover"); },					  
				mouseout: function (){ this.removeClass("hover"); }					  
			});
		}
		
		//grab all elements
		gen.dom.publishing_method = $("publishing_method");
		gen.dom.google_api = $("google_api");
		gen.dom.use_express_install = $("use_express_install");
		gen.dom.basics.h2 = $("basics");
		gen.dom.advanced.h2 = $("advanced");
		gen.dom.advanced.teaser = $("advanced-options-teaser");
		
		//Initial setup for various elements
		gen.dom.publishing_method.addEvent("change", gen.toggleDynamicFields);
		if(gen.dom.publishing_method.value === "static"){ gen.toggleDynamicFields(); }	
	
		gen.dom.google_api.addEvent("change", gen.setGoogleAPI);
		if(gen.dom.google_api.value === "true"){ gen.setGoogleAPI(); }	
	
		$("full_browser").addEvent("change", gen.setSwfSizeFields);
		
		gen.dom.use_express_install.addEvent("change", gen.toggleExpressInstallUrlField);
		if(gen.dom.use_express_install.value === "false"){ gen.toggleExpressInstallUrlField(); }
	
		var text_basics = gen.dom.basics.h2.get("text");
		gen.dom.basics.h2.innerHTML = "";
		gen.dom.basics.toggler = new Element("a", {
			events: { "click": function () { gen.toggleSection("basics");} },
			"class": "expanded",
			text: text_basics
		}).inject(gen.dom.basics.h2);

		gen.dom.basics.summary = new Element("div", {
			html: "Click here to edit your basic settings.",
			id: "basics-summary",
			"class": "hidden",
			events: { "click": function () { gen.toggleSection("basics"); } }
		}).inject("basics-wrapper");

		var text_advanced = gen.dom.advanced.h2.get("text");
		gen.dom.advanced.h2.innerHTML = "";
		gen.dom.advanced.toggler = new Element("a", {
			events: { "click": function () { gen.toggleSection("advanced");} },
			"class": "expanded",
			text: text_advanced
		}).inject(gen.dom.advanced.h2);
		
		gen.dom.advanced.teaser = new Element("p", {
			html: "Click here if you'd like to specify advanced options, including FlashVars and other Flash Player parameters.",
			id: "advanced-options-teaser",
			"class": "hidden",
			events: { "click": function () { gen.toggleSection("advanced"); } }
		}).inject("advanced-wrapper");
		
		//Hide advanced options by default
		gen.toggleSection("advanced");

		/* -- Set up generated code section --- */
		gen.dom.generated.form = new Element("form", {
			method: "post",
			action: "downloader.php",
			events: {
				submit: function (){
					if($("code")){
						$code.value = gen.dom.generated.code.get("text");
					} else {
						var ta = new Element("textarea", { 
							id: "code", 
							name: "code", 
							value: gen.dom.generated.code.get("text"),
							"class": "hidden"
						}).inject(gen.dom.generated.form);
					}
				}
			}
		}).inject("generator", "after");
		gen.dom.generated.h2 = new Element("h2", { id: "generated", html: "Generated Code" }).inject(gen.dom.generated.form);
		gen.dom.generated.wrapper = new Element("div", { id: "generated-wrapper" }).inject(gen.dom.generated.form);	
		gen.dom.generated.code = new Element("pre", { html: "Please complete the form then click the 'Generate Code' button" }).inject(gen.dom.generated.wrapper);

		//Set up description togglers
		$(document.body).getElements(".description").each(function (el){
			el.addClass("hidden");
			var label = el.getPrevious("label");
			if(label){
				var a = new Element("a", {
					html: "[?]",
					"class": "help_link",
					href: "#",
					events: {
						click: function (){
							el.toggleClass("hidden");
							el.toggleClass("attention");
							return false;
						}
					}
				}).inject(label, "top");
			}
		});
		
		//Set up auto-expanding textareas
		$(document.body).getElements("textarea").each(function(textarea){
			var fx = new Fx.Morph(textarea, { duration: 350, transition: Fx.Transitions.Expo.easeOut });
			textarea.setStyle("overflow", "hidden");		
			textarea.addEvents({
				keyup: function() { gen.setTextAreaHeight(this, fx); }
			});
			gen.setTextAreaHeight(textarea, fx);
		});
		
	},

	setTextAreaHeight: function (textarea, fx){
		if(textarea.getScrollSize().y > textarea.getSize().y) {
			fx.start({ height: textarea.getScrollSize().y });
		}
	},

	toggleDynamicFields: function (){
		$("id_attribute").getParent("div").toggleClass("hidden");	
	},

	setGoogleAPI: function (){
		var swfobject_js = $("swfobject_js");
		if(gen.dom.google_api.value === "true"){
			swfobject_js.value = "//ajax.googleapis.com/ajax/libs/swfobject/2.2/swfobject.js";
			swfobject_js.disabled = "disabled";
		} else {
			swfobject_js.disabled = false;
			swfobject_js.value = "";
			swfobject_js.focus();
		}
	},
	
	setSwfSizeFields: function (){
		$("width").value = "100";
		$("width_unit").selectedIndex = 1;
		$("height").value = "100";
		$("height_unit").selectedIndex = 1;
	},
	
	toggleExpressInstallUrlField: function (){
		var field = $("express_install_url");
		var dad = field.getParent("div");
		dad.toggleClass("hidden");
		if(!dad.hasClass("hidden")){ field.focus(); }
	},

	toggleSection: function (sectionname){
		if(sectionname === "basics"){
			$("basics-content-wrapper").toggleClass("hidden");
			gen.dom.basics.toggler.toggleClass("expanded");
			gen.dom.basics.summary.toggleClass("hidden");
			
		}
		if(sectionname === "advanced"){
			$("advanced-flashvars").toggleClass("hidden");
			$("advanced-attributes").toggleClass("hidden");
			$("advanced-parameters").toggleClass("hidden");
			gen.dom.advanced.teaser.toggleClass("hidden");
			gen.dom.advanced.toggler.toggleClass("expanded");
		}
	},

	processForm: function (e){
	//*	
		e.stop();
		
		if(!gen.validates()){ return false; }
		
		//input type="hidden" causes problems in PHP
		var input = new Element("input", {
			type: "text",
			value: "true",
			name: "use_text_response",
			id: "use_text_response",
			"class": "hidden"
		}).inject("generator");
		
		var myHTMLRequest = new Request({ 
			url: this.action,
			onSuccess: function (text){
				
				//Minimize settings areas
				if(gen.dom.basics.toggler.hasClass("expanded")){ gen.toggleSection("basics"); }
				if(gen.dom.advanced.toggler.hasClass("expanded")){ gen.toggleSection("advanced"); }
				
				//Fix line breaks in IE
				var cleaned_text = (Browser.Engine.trident) ? text.replace(/(\r\n|\r|\n)/g, "<br />") : text;
				
				//Display generated code
				gen.dom.generated.code.empty();
				gen.dom.generated.code.set("html", cleaned_text);
				
				//Add instructions to the generated code section
				if(!$("instructions")){
					var instructions = "Copy the following code and paste into a blank HTML document <b>or</b> download using the 'download' button.<br/>";
					var p = new Element("p", { html: instructions, id: "instructions" }).inject(gen.dom.generated.wrapper, "top");
					var button = new Element("button", { 
						id: "download_button", 
						type: "submit", 
						value: "Download as HTML"
					}).inject(p);
					
					//Make IE6 play nice
					if(Browser.Engine.trident){
						button.addEvents({
							mouseover: function (){ this.addClass("hover"); },					  
							mouseout: function (){ this.removeClass("hover"); }					  
						});
					}
	
				}
				
			}
		}).post(this);
	//*/
	},
	
	validates: function (){
		
		function msg(field, text){
			alert(text);
			field.focus();
			return false;
		}
		
		if(!$("id").value){
			return msg($("id"), "Please enter an ID for your SWF");
		}
		if(!$("swf_url").value){
			return msg($("swf_url"), "Please enter the URL for your SWF");
		}
		if(!$("swfobject_js").value){
			return msg($("swfobject_js"), "Please enter the URL for your swfobject.js file");
		}
		if(!$("major").value){
			return msg($("major"), "Please specify the minimum major version of Flash Player required");
		}
		if(!$("width").value){
			return msg($("width"), "Please enter the width of your SWF");
		}
		if(!$("height").value){
			return msg($("height"), "Please enter the height of your SWF");
		}
		
		if($("use_express_install").value === "true"){
			if(!$("express_install_url").value){
				return msg($("express_install_url"), "Please enter the URL for your Express Install SWF");
			}
			if(parseInt($("width").value) < 310 && $("width_unit").value === "px"){
				return msg($("width"), "Express Install requires a SWF width of at least 310 pixels");
			}
			if(parseInt($("height").value && $("height_unit").value === "px") < 137){
				return msg($("height"), "Express Install requires a SWF height of at least 137 pixels");
			}
		}
		return true;
		
	}
	
};

window.addEvent("domready", gen.init);


var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-1394306-7']);
_gaq.push(['_trackPageview']);
(function() {
	var ga = document.createElement('script'); 
	ga.type = 'text/javascript'; 
	ga.async = true;
	ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
	var s = document.getElementsByTagName('script')[0]; 
	s.parentNode.insertBefore(ga, s);
})();