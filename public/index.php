<html>
    <!-- Testing -->
	<head>
		<link rel="stylesheet" type="text/css" href="/styles.css" media="screen"/>
	</head>
	<body>
		<div id="container">
			<div id="logo">
				<img src="/images/logo-engineyard.png">
			</div>
			<div id="content">
				
				<h2>Seriously, how easy was that?!</h2>

				<p>This is just a simple bit of code, deployed from a <a href="https://github.com/engineyard/howto">repository on GitHub</a> and a <strong>master</strong> branch to show you how  you can be quickly up and running.</p>
				
				<h2>Test data from <a href="http://php.net/">PHP</a></h2>
				<p>
				<?php
                    $version = phpversion();
					echo "<p>Your app is running on PHP version: " . $version . "<br/></p>";
					echo "<p>The app IP is: " . $_SERVER['SERVER_ADDR'] . "<br/></p>";
					// Solos will return a remote_addr correctly,
					// HAProxy passes client IP using the X_Forwarded_For header
					if(isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
						$client_ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
					} else {
						$client_ip = $_SERVER['REMOTE_ADDR'];
					}
					echo "<p>The client IP is : " . $client_ip . "<br/></p>";
					echo "<p>Temp dir available to your app is: " . sys_get_temp_dir() . "</p>";
				?>
				</p>
				<h2>Code from above</h2>
<?php
$code = highlight_string('
<?php
	$version = phpversion();
	$ip = $_SERVER["SERVER_ADDR"];
	$ip = $_SERVER["HTTP_X_FORWARDED_FOR"];
	$temp = sys_get_temp_dir();
?>',1);
echo $code;
?>
			<div>
		</div>
	</body>
</html>
