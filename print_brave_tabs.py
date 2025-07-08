from selenium import webdriver
from selenium.common.exceptions import NoSuchElementException
import time

# IMPORTANT: Close all Chrome windows before running this script.

CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
USER_PROFILE = "/Users/sanchitsingh/Library/Application Support/Google/Chrome/Default"

options = webdriver.ChromeOptions()
options.binary_location = CHROME_PATH
options.add_argument(f"user-data-dir={USER_PROFILE}")

driver = webdriver.Chrome(options=options)
driver.get("https://www.google.com")

time.sleep(3)  # Wait for the page to load

print("Title:", driver.title)
print("URL:", driver.current_url)

# Check for Google Account avatar (indicates login)
try:
    avatar = driver.find_element("css selector", "a[aria-label*='Google Account']")
    print("You are logged in! Found account avatar.")
    print("Avatar aria-label:", avatar.get_attribute("aria-label"))
except NoSuchElementException:
    print("You are NOT logged in or the avatar could not be found.")

driver.quit()