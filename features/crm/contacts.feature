@crm @contacts
Feature: Contact Management
  As a sales user
  I want to manage contacts in Dynamics CRM
  So that I can track relationships with customers

  Background:
    Given I am logged into CRM

  # ── Create ────────────────────────────────────────────────────────────────

  @smoke @create
  Scenario: Successfully create a contact with required fields
    Given I navigate to the Contacts list
    When I click New
    And I fill in the contact last name with a unique test value
    And I click Save
    Then the contact should be saved successfully
    And I should see the contact in the Contacts grid

  @regression @create
  Scenario: Create a contact with all fields
    Given I navigate to the Contacts list
    When I click New
    And I fill in the contact first name with a unique test value
    And I fill in the contact last name with a unique test value
    And I fill in the email with a unique test email
    And I fill in the phone with a unique test phone
    And I fill in the job title with "QA Engineer"
    And I click Save
    Then the contact should be saved successfully

  # ── Validation ────────────────────────────────────────────────────────────

  @regression @validation
  Scenario: Contact requires Last Name to be saved
    Given I navigate to the Contacts list
    When I click New
    And I click Save without filling any fields
    Then I should see a required field validation error for Last Name

  # ── Search ────────────────────────────────────────────────────────────────

  @regression @search
  Scenario: Search for an existing contact by name
    Given a contact with a unique last name exists in CRM
    When I navigate to the Contacts list
    And I search for the contact by last name
    Then the contact should appear in the search results

  # ── Update ────────────────────────────────────────────────────────────────

  @regression @update
  Scenario: Update a contact's job title
    Given a contact with a unique last name exists in CRM
    When I open the contact record
    And I update the job title to "Senior QA Engineer"
    And I click Save
    Then the contact should be saved successfully
    And the job title should display "Senior QA Engineer"

  # ── Delete ────────────────────────────────────────────────────────────────

  @regression @delete
  Scenario: Delete a contact
    Given a contact with a unique last name exists in CRM
    When I open the contact record
    And I click Delete and confirm
    Then the contact should no longer appear in the Contacts grid
