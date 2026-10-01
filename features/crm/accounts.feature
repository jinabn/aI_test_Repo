@crm @accounts
Feature: Account Management
  As a sales user
  I want to manage accounts in Dynamics CRM
  So that I can track company relationships

  Background:
    Given I am logged into CRM

  @smoke @create
  Scenario: Successfully create an account with a name
    Given I navigate to the Accounts list
    When I click New
    And I fill in the account name with a unique test value
    And I click Save
    Then the account should be saved successfully
    And I should see the account in the Accounts grid

  @regression @create
  Scenario: Create an account with full details
    Given I navigate to the Accounts list
    When I click New
    And I fill in the account name with a unique test value
    And I fill in the phone with a unique test phone
    And I fill in the website with a unique test URL
    And I click Save
    Then the account should be saved successfully

  @regression @validation
  Scenario: Account requires Name to be saved
    Given I navigate to the Accounts list
    When I click New
    And I click Save without filling any fields
    Then I should see a required field validation error for Account Name

  @regression @search
  Scenario: Search for an existing account by name
    Given an account with a unique name exists in CRM
    When I navigate to the Accounts list
    And I search for the account by name
    Then the account should appear in the search results

  @regression @delete
  Scenario: Delete an account
    Given an account with a unique name exists in CRM
    When I open the account record
    And I click Delete and confirm
    Then the account should no longer appear in the Accounts grid
